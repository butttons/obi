import { type VaultContext, resolveVault } from "../utils/vault.ts";
import { output } from "../utils/output.ts";

export type CommandContext = {
	vault: VaultContext;
};

/**
 * Set up command context by resolving the vault.
 */
export async function setupCommand({
	vaultName,
}: {
	vaultName?: string;
}): Promise<CommandContext> {
	const vault = await resolveVault({ vaultName });
	return { vault };
}

/**
 * Parse an integer flag with a default value.
 */
export function parseIntFlag({
	flags,
	key,
	defaultValue,
}: {
	flags: Record<string, string | boolean>;
	key: string;
	defaultValue: number;
}): number {
	const value = flags[key];
	if (value === undefined || value === true) {
		return defaultValue;
	}
	const parsed = parseInt(value as string, 10);
	return isNaN(parsed) ? defaultValue : parsed;
}

export { output };
