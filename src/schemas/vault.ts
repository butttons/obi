import { z } from "zod/v4";

export const VaultInfoSchema = z.object({
	name: z.string(),
	path: z.string(),
	note_count: z.number(),
});

export const VaultsResultSchema = z.object({
	vaults_path: z.string(),
	default_vault: z.string().nullable(),
	vaults: z.array(VaultInfoSchema),
});
