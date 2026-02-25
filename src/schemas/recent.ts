import { z } from "zod/v4";
import { QueryEntrySchema } from "./query.ts";

export const RecentEntrySchema = z.object({
	path: z.string(),
	title: z.string().nullable(),
	updated_at: z.string().nullable(),
});

export const RecentResultSchema = z.object({
	vault: z.string(),
	entries: z.array(RecentEntrySchema),
});

export const UnreadResultSchema = z.object({
	vault: z.string(),
	entries: z.array(QueryEntrySchema),
});
