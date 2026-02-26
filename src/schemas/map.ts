import { z } from "zod/v4";

export const FolderEntrySchema = z.object({
	path: z.string(),
	file_count: z.number(),
});

export const FileEntrySchema = z.object({
	path: z.string(),
	title: z.string().nullable(),
	type: z.string().nullable(),
	word_count: z.number(),
	size_bytes: z.number(),
});

export const MapResultSchema = z.object({
	vault: z.string(),
	folders: z.array(FolderEntrySchema),
	files: z.array(FileEntrySchema),
});
