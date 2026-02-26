import { z } from "zod/v4";

export const ListEntrySchema = z.object({
	path: z.string(),
	title: z.string().nullable(),
	type: z.string().nullable(),
	tags: z.array(z.string()),
	word_count: z.number(),
	size_bytes: z.number(),
});

export const ListResultSchema = z.object({
	vault: z.string(),
	folder: z.string(),
	entries: z.array(ListEntrySchema),
});
