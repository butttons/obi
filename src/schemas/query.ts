import { z } from "zod/v4";

export const QueryEntrySchema = z.object({
	path: z.string(),
	frontmatter: z.record(z.string(), z.unknown()),
});

export const QueryResultSchema = z.object({
	vault: z.string(),
	filters: z.record(z.string(), z.string()),
	results: z.array(QueryEntrySchema),
});

export const SearchMatchSchema = z.object({
	path: z.string(),
	line: z.number(),
	text: z.string(),
});

export const SearchResultSchema = z.object({
	vault: z.string(),
	term: z.string(),
	matches: z.array(SearchMatchSchema),
});
