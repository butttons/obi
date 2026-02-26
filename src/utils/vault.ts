import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join, resolve, basename } from "node:path";
import { homedir } from "node:os";
import { ObiError } from "./errors.ts";

const ICLOUD_VAULTS_PATH = join(
	homedir(),
	"Library/Mobile Documents/iCloud~md~obsidian/Documents",
);

const GLOBAL_CONFIG_PATH = join(
	homedir(),
	".config/obi/config.json",
);

const HARD_IGNORED = [".obsidian", ".git", ".pi", "node_modules"];

type VaultLocalConfig = {
	ignore?: string[];
};

type GlobalConfig = {
	default_vault?: string;
	vaults?: Record<string, { ignore?: string[] }>;
};

export type VaultContext = {
	name: string;
	path: string;
	ignorePatterns: string[];
	templatesFolder: string | null;
};

/**
 * Resolve the parent directory containing all vaults.
 */
export function resolveVaultsPath(): string {
	const envPath = process.env.OBI_VAULTS_PATH;
	if (envPath) {
		const resolved = resolve(envPath);
		if (existsSync(resolved)) {
			return resolved;
		}
		throw new ObiError("OBI_VAULTS_PATH does not exist", "VAULTS_PATH_MISSING", {
			path: resolved,
		});
	}

	if (existsSync(ICLOUD_VAULTS_PATH)) {
		return ICLOUD_VAULTS_PATH;
	}

	throw new ObiError(
		"No vaults path found. Set OBI_VAULTS_PATH or use iCloud Obsidian sync.",
		"VAULTS_PATH_MISSING",
	);
}

/**
 * List vault directories (directories containing .obsidian/).
 */
export async function listVaults(): Promise<Array<{ name: string; path: string }>> {
	const vaultsPath = resolveVaultsPath();
	const entries = await readdir(vaultsPath, { withFileTypes: true });
	const vaults: Array<{ name: string; path: string }> = [];

	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const vaultPath = join(vaultsPath, entry.name);
		if (existsSync(join(vaultPath, ".obsidian"))) {
			vaults.push({ name: entry.name, path: vaultPath });
		}
	}

	return vaults;
}

/**
 * Load global config from ~/.config/obi/config.json.
 */
function loadGlobalConfig(): GlobalConfig {
	if (!existsSync(GLOBAL_CONFIG_PATH)) {
		return {};
	}
	try {
		const file = Bun.file(GLOBAL_CONFIG_PATH);
		// Synchronous read not available on Bun.file; we rely on the async caller
		return {};
	} catch {
		return {};
	}
}

async function loadGlobalConfigAsync(): Promise<GlobalConfig> {
	if (!existsSync(GLOBAL_CONFIG_PATH)) {
		return {};
	}
	try {
		const file = Bun.file(GLOBAL_CONFIG_PATH);
		return (await file.json()) as GlobalConfig;
	} catch {
		return {};
	}
}

/**
 * Load vault-local config from <vault>/.obsidian/obi.json.
 */
async function loadVaultLocalConfig({ vaultPath }: { vaultPath: string }): Promise<VaultLocalConfig> {
	const configPath = join(vaultPath, ".obsidian", "obi.json");
	if (!existsSync(configPath)) {
		return {};
	}
	try {
		const file = Bun.file(configPath);
		return (await file.json()) as VaultLocalConfig;
	} catch {
		return {};
	}
}

/**
 * Read the core templates.json to get the templates folder name.
 */
async function readTemplatesFolder({ vaultPath }: { vaultPath: string }): Promise<string | null> {
	const templatesJsonPath = join(vaultPath, ".obsidian", "templates.json");
	if (!existsSync(templatesJsonPath)) {
		return null;
	}
	try {
		const file = Bun.file(templatesJsonPath);
		const data = (await file.json()) as { folder?: string };
		return data.folder ?? null;
	} catch {
		return null;
	}
}

/**
 * Detect if cwd is inside a vault and return its name and path.
 */
function detectVaultFromCwd({ vaultsPath }: { vaultsPath: string }): { name: string; path: string } | null {
	const cwd = process.cwd();
	const resolved = resolve(cwd);

	// Check if cwd is inside the vaults directory
	if (!resolved.startsWith(vaultsPath)) {
		return null;
	}

	// Walk up from cwd looking for .obsidian
	let current = resolved;
	while (current.startsWith(vaultsPath) && current !== vaultsPath) {
		if (existsSync(join(current, ".obsidian"))) {
			return { name: basename(current), path: current };
		}
		current = resolve(current, "..");
	}

	return null;
}

/**
 * Resolve which vault to use, given an optional --vault flag.
 */
export async function resolveVault({ vaultName }: { vaultName?: string }): Promise<VaultContext> {
	const vaultsPath = resolveVaultsPath();
	const globalConfig = await loadGlobalConfigAsync();

	let name: string;
	let vaultPath: string;

	if (vaultName) {
		// Explicit --vault flag
		vaultPath = join(vaultsPath, vaultName);
		if (!existsSync(join(vaultPath, ".obsidian"))) {
			const available = await listVaults();
			throw new ObiError(`Vault "${vaultName}" not found`, "VAULT_NOT_FOUND", {
				available: available.map((v) => v.name),
			});
		}
		name = vaultName;
	} else {
		// Try cwd detection
		const detected = detectVaultFromCwd({ vaultsPath });
		if (detected) {
			name = detected.name;
			vaultPath = detected.path;
		} else if (globalConfig.default_vault) {
			// Fall back to default_vault from global config
			name = globalConfig.default_vault;
			vaultPath = join(vaultsPath, name);
			if (!existsSync(join(vaultPath, ".obsidian"))) {
				throw new ObiError(
					`Default vault "${name}" not found`,
					"VAULT_NOT_FOUND",
				);
			}
		} else {
			const available = await listVaults();
			throw new ObiError(
				"No vault specified. Use --vault or set default_vault in config.",
				"NO_VAULT",
				{ available: available.map((v) => v.name) },
			);
		}
	}

	// Resolve ignore patterns: local config wins over global config
	const localConfig = await loadVaultLocalConfig({ vaultPath });
	const globalVaultConfig = globalConfig.vaults?.[name];

	// Local ignore wins if present, else global vault-specific ignore, else empty
	const configIgnore = localConfig.ignore ?? globalVaultConfig?.ignore ?? [];

	// Templates folder is always ignored by default
	const templatesFolder = await readTemplatesFolder({ vaultPath });
	const templateIgnore = templatesFolder ? [templatesFolder] : [];

	const ignorePatterns = [...HARD_IGNORED, ...templateIgnore, ...configIgnore];

	return { name, path: vaultPath, ignorePatterns, templatesFolder };
}

/**
 * Check if a relative path should be ignored.
 */
export function isIgnored({
	relativePath,
	ignorePatterns,
}: {
	relativePath: string;
	ignorePatterns: string[];
}): boolean {
	const segments = relativePath.split("/");
	for (const pattern of ignorePatterns) {
		const clean = pattern.replace(/\/$/, "");
		// Match if any path segment starts with the pattern, or the path starts with it
		if (segments[0] === clean || relativePath.startsWith(clean + "/") || relativePath === clean) {
			return true;
		}
	}
	return false;
}

/**
 * Collect all markdown files in a vault, respecting ignore patterns.
 */
export async function collectNotes({ vault }: { vault: VaultContext }): Promise<string[]> {
	const notes: string[] = [];

	async function walk({ dir, prefix }: { dir: string; prefix: string }): Promise<void> {
		const entries = await readdir(dir, { withFileTypes: true });
		for (const entry of entries) {
			const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

			if (isIgnored({ relativePath, ignorePatterns: vault.ignorePatterns })) {
				continue;
			}

			if (entry.isDirectory()) {
				await walk({ dir: join(dir, entry.name), prefix: relativePath });
			} else if (entry.isFile() && entry.name.endsWith(".md")) {
				notes.push(relativePath);
			}
		}
	}

	await walk({ dir: vault.path, prefix: "" });
	return notes.sort();
}

/**
 * Collect all directories in a vault, respecting ignore patterns.
 */
export async function collectFolders({ vault }: { vault: VaultContext }): Promise<string[]> {
	const folders: string[] = [];

	async function walk({ dir, prefix }: { dir: string; prefix: string }): Promise<void> {
		const entries = await readdir(dir, { withFileTypes: true });
		for (const entry of entries) {
			if (!entry.isDirectory()) continue;
			const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

			if (isIgnored({ relativePath, ignorePatterns: vault.ignorePatterns })) {
				continue;
			}

			folders.push(relativePath);
			await walk({ dir: join(dir, entry.name), prefix: relativePath });
		}
	}

	await walk({ dir: vault.path, prefix: "" });
	return folders.sort();
}

/**
 * Read a JSON file from .obsidian/, returning null if missing or invalid.
 */
export async function readObsidianJson<T>({
	vault,
	filename,
}: {
	vault: VaultContext;
	filename: string;
}): Promise<T | null> {
	const filePath = join(vault.path, ".obsidian", filename);
	if (!existsSync(filePath)) {
		return null;
	}
	try {
		const file = Bun.file(filePath);
		return (await file.json()) as T;
	} catch {
		return null;
	}
}
