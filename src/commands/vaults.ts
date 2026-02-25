import {
	resolveVaultsPath,
	listVaults,
	resolveVault,
	collectNotes,
} from "../utils/vault.ts";
import type { VaultsResult } from "../types.ts";

export async function vaults(): Promise<VaultsResult> {
	const vaultsPath = resolveVaultsPath();
	const discovered = await listVaults();

	// Try to read default_vault from global config
	let defaultVault: string | null = null;
	try {
		const configPath = `${process.env.HOME}/.config/obi/config.json`;
		const file = Bun.file(configPath);
		const config = (await file.json()) as { default_vault?: string };
		defaultVault = config.default_vault ?? null;
	} catch {
		// No global config or invalid
	}

	const vaultsWithCounts = await Promise.all(
		discovered.map(async (v) => {
			const vault = await resolveVault({ vaultName: v.name });
			const notes = await collectNotes({ vault });
			return {
				name: v.name,
				path: v.path,
				note_count: notes.length,
			};
		}),
	);

	return {
		vaults_path: vaultsPath,
		default_vault: defaultVault,
		vaults: vaultsWithCounts,
	};
}
