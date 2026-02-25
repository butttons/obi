import { z } from "zod/v4";

export const ContextResultSchema = z.object({
	vault: z.string(),
	active_file: z.string().nullable(),
	recent_files: z.array(z.string()),
	last_search: z.string().nullable(),
	open_tabs: z.array(z.string()),
});
