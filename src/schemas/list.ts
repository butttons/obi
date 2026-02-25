import { z } from "zod/v4";

export const ListEntrySchema = z.object({
	path: z.string(),
	title: z.string().nullable(),
	type: z.string().nullable(),
	tags: z.array(z.string()),
});

export const ListResultSchema = z.object({
	vault: z.string(),
	folder: z.string(),
	entries: z.array(ListEntrySchema),
});
