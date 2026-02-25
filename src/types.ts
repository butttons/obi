import type { z } from "zod/v4";

import type { VaultInfoSchema, VaultsResultSchema } from "./schemas/vault.ts";
import type { FolderEntrySchema, FileEntrySchema, MapResultSchema } from "./schemas/map.ts";
import type { ContextResultSchema } from "./schemas/context.ts";
import type { PropertyDefSchema, SchemaResultSchema } from "./schemas/schema.ts";
import type {
	ReadResultSchema,
	HeadingSchema,
	TocResultSchema,
	LinksResultSchema,
} from "./schemas/note.ts";
import type { ListEntrySchema, ListResultSchema } from "./schemas/list.ts";
import type {
	QueryEntrySchema,
	QueryResultSchema,
	SearchMatchSchema,
	SearchResultSchema,
} from "./schemas/query.ts";
import type { RecentEntrySchema, RecentResultSchema, UnreadResultSchema } from "./schemas/recent.ts";

export type VaultInfo = z.infer<typeof VaultInfoSchema>;
export type VaultsResult = z.infer<typeof VaultsResultSchema>;

export type FolderEntry = z.infer<typeof FolderEntrySchema>;
export type FileEntry = z.infer<typeof FileEntrySchema>;
export type MapResult = z.infer<typeof MapResultSchema>;

export type ContextResult = z.infer<typeof ContextResultSchema>;

export type PropertyDef = z.infer<typeof PropertyDefSchema>;
export type SchemaResult = z.infer<typeof SchemaResultSchema>;

export type ReadResult = z.infer<typeof ReadResultSchema>;
export type Heading = z.infer<typeof HeadingSchema>;
export type TocResult = z.infer<typeof TocResultSchema>;
export type LinksResult = z.infer<typeof LinksResultSchema>;

export type ListEntry = z.infer<typeof ListEntrySchema>;
export type ListResult = z.infer<typeof ListResultSchema>;

export type QueryEntry = z.infer<typeof QueryEntrySchema>;
export type QueryResult = z.infer<typeof QueryResultSchema>;
export type SearchMatch = z.infer<typeof SearchMatchSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;

export type RecentEntry = z.infer<typeof RecentEntrySchema>;
export type RecentResult = z.infer<typeof RecentResultSchema>;
export type UnreadResult = z.infer<typeof UnreadResultSchema>;
