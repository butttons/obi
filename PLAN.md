# obi -- Obsidian Vault CLI for LLMs

A read-only CLI that surfaces structured data from Obsidian vaults for LLM consumption. Default output is TOON (Token-Oriented Object Notation), with `--json` fallback.

## Problem

Current tooling (`notesmd-cli`) is built for humans, not agents. Search is interactive (fzf), output is unstructured, and the rich metadata inside `.obsidian/` is completely ignored. LLMs are stuck with raw `grep` or must already know exact file paths.

## Solution

Parse both note content and `.obsidian/` plugin data to give LLMs structured, queryable access to the vault. Every command returns typed data. The LLM can orient, navigate, and query without grep gymnastics.

## Data Sources

| Source | File | What it gives us |
|---|---|---|
| Frontmatter | Every `.md` file | title, type, status, tags, git, project, read, timestamps |
| Wiki-links | Every `.md` file | Directed graph of connections between notes |
| Headings | Every `.md` file | Document structure / table of contents |
| Icon folder | `.obsidian/plugins/obsidian-icon-folder/data.json` | Semantic taxonomy: icons + colors per file/folder |
| Types | `.obsidian/types.json` | Property schema: what fields exist, what types they are |
| Workspace | `.obsidian/workspace.json` | Active file, recent files, last search, open tabs |
| Templates | `.obsidian/plugins/templater-obsidian/data.json` | Folder-to-template mappings |
| Tasks config | `.obsidian/plugins/obsidian-tasks-plugin/data.json` | Task statuses: todo, done, in-progress, cancelled |
| Core plugins | `.obsidian/core-plugins.json` | Which features are enabled |

## CLI Name

`obi` -- from obsidian. Short, no known conflicts, reads well with subcommands.

## Config

### Vault Path Resolution

1. `DOT_OBSIDIAN_PATH` env var pointing to the vaults parent directory
2. Fall back to `~/Library/Mobile Documents/iCloud~md~obsidian/Documents`
3. Neither exists -- error with setup instructions

### Config Resolution

1. If cwd is inside a vault (has `.obsidian/` in it or a parent), use `.obsidian/dot-obsidian.json` from that vault
2. Else, global config at `~/.config/dot-obsidian/config.json`
3. Else, no config -- defaults apply

### Vault-Local Config

Lives at `<vault>/.obsidian/dot-obsidian.json`. Applies only to that vault.

```json
{
  "ignore": ["templates/"]
}
```

### Global Config

Lives at `~/.config/dot-obsidian/config.json`. Cross-vault settings.

```json
{
  "default_vault": "Work",
  "vaults": {
    "Work": {
      "ignore": ["templates/"]
    },
    "Zomunk": {
      "ignore": ["templates/", ".residue/"]
    }
  }
}
```

### Ignore Patterns

Hard-coded (always, not configurable): `.obsidian/`, `.git/`, `.pi/`, `node_modules/`.

Per-vault `ignore` in config is additive on top of those. Templates are ignored by default.

If both local and global config exist for the same vault, the local one wins for ignore patterns.

### Vault Flag

`--vault` accepts a vault name (`Work`, `Zomunk`). If omitted:

1. If cwd is inside a vault, use that vault
2. Else, use `default_vault` from global config
3. Else, error listing available vaults

## Commands

### Orientation

| Command | What it does |
|---|---|
| `obi vaults` | List all available vaults with their paths and note counts |
| `obi map` | Full vault taxonomy from icon-folder + frontmatter. Folders with icons/colors, files with type + title |
| `obi context` | Current workspace state: active file, recent files, last search, open tabs |
| `obi schema` | Property types from `types.json`, all tags in use, all `type` values in use, task statuses |

### Navigation

| Command | What it does |
|---|---|
| `obi read <path>` | Frontmatter (parsed) + body (markdown string) + outgoing links + incoming links |
| `obi read <path> --section "Heading"` | Just the content under that heading |
| `obi toc <path>` | Heading tree for a note |
| `obi links <path>` | Outgoing links, incoming links (backlinks), 2-hop connections |
| `obi list [folder]` | Folder contents with title, type, tags from frontmatter |

### Query

| Command | What it does |
|---|---|
| `obi query --type worker` | Filter notes by frontmatter field values |
| `obi query --tag billing` | Filter by tag |
| `obi query --type worker --tag deals` | Compound filter (AND logic) |
| `obi search <term>` | Content search with file + line + context, structured output |
| `obi recent [--limit N]` | Notes sorted by `updated_at` from frontmatter |
| `obi unread` | Notes where `read: false` (empty result if vault has no `read` field) |

### Global Flags

| Flag | What it does |
|---|---|
| `--json` | Output JSON instead of TOON |
| `--vault <name>` | Target vault name |

## Result Schemas (Zod)

### vaults

```typescript
const VaultInfoSchema = z.object({
  name: z.string(),
  path: z.string(),
  note_count: z.number(),
});

const VaultsResultSchema = z.object({
  vaults_path: z.string(),
  default_vault: z.string().nullable(),
  vaults: z.array(VaultInfoSchema),
});
```

### map

```typescript
const FolderEntrySchema = z.object({
  path: z.string(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  file_count: z.number(),
});

const FileEntrySchema = z.object({
  path: z.string(),
  title: z.string().nullable(),
  type: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
});

const MapResultSchema = z.object({
  vault: z.string(),
  folders: z.array(FolderEntrySchema),
  files: z.array(FileEntrySchema),
});
```

### context

```typescript
const ContextResultSchema = z.object({
  vault: z.string(),
  active_file: z.string().nullable(),
  recent_files: z.array(z.string()),
  last_search: z.string().nullable(),
  open_tabs: z.array(z.string()),
});
```

### schema

```typescript
const PropertyDefSchema = z.object({
  name: z.string(),
  type: z.string(),
});

const TaskStatusSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  type: z.string(),
});

const SchemaResultSchema = z.object({
  vault: z.string(),
  properties: z.array(PropertyDefSchema),
  types_in_use: z.array(z.string()),
  tags_in_use: z.array(z.string()),
  task_statuses: z.array(TaskStatusSchema),
});
```

### read

```typescript
const ReadResultSchema = z.object({
  path: z.string(),
  vault: z.string(),
  frontmatter: z.record(z.unknown()),
  body: z.string(),
  outgoing_links: z.array(z.string()),
  incoming_links: z.array(z.string()),
});
```

### toc

```typescript
const HeadingSchema = z.object({
  level: z.number(),
  text: z.string(),
  line: z.number(),
});

const TocResultSchema = z.object({
  path: z.string(),
  vault: z.string(),
  headings: z.array(HeadingSchema),
});
```

### links

```typescript
const LinksResultSchema = z.object({
  path: z.string(),
  vault: z.string(),
  outgoing: z.array(z.string()),
  incoming: z.array(z.string()),
  two_hop: z.array(z.string()),
});
```

### list

```typescript
const ListEntrySchema = z.object({
  path: z.string(),
  title: z.string().nullable(),
  type: z.string().nullable(),
  tags: z.array(z.string()),
});

const ListResultSchema = z.object({
  vault: z.string(),
  folder: z.string(),
  entries: z.array(ListEntrySchema),
});
```

### query

```typescript
const QueryEntrySchema = z.object({
  path: z.string(),
  frontmatter: z.record(z.unknown()),
});

const QueryResultSchema = z.object({
  vault: z.string(),
  filters: z.record(z.string()),
  results: z.array(QueryEntrySchema),
});
```

### search

```typescript
const SearchMatchSchema = z.object({
  path: z.string(),
  line: z.number(),
  text: z.string(),
});

const SearchResultSchema = z.object({
  vault: z.string(),
  term: z.string(),
  matches: z.array(SearchMatchSchema),
});
```

### recent

```typescript
const RecentEntrySchema = z.object({
  path: z.string(),
  title: z.string().nullable(),
  updated_at: z.string().nullable(),
});

const RecentResultSchema = z.object({
  vault: z.string(),
  entries: z.array(RecentEntrySchema),
});
```

### unread

```typescript
const UnreadResultSchema = z.object({
  vault: z.string(),
  entries: z.array(QueryEntrySchema),
});
```

## File Structure

```
src/
  index.ts                 # CLI entry point, commander setup
  types.ts                 # re-export all types from schemas
  commands/
    vaults.ts
    map.ts
    context.ts
    schema.ts
    read.ts
    toc.ts
    links.ts
    list.ts
    query.ts
    search.ts
    recent.ts
    unread.ts
    shared.ts              # setupCommand, vault resolution, flag parsers
  schemas/
    vault.ts               # VaultsResult, VaultInfo
    map.ts                 # MapResult, FolderEntry, FileEntry
    context.ts             # ContextResult
    schema.ts              # SchemaResult, PropertyDef, TaskStatus
    note.ts                # ReadResult, TocResult, LinksResult
    query.ts               # QueryResult, SearchResult, QueryEntry, SearchMatch
    list.ts                # ListResult, ListEntry
    recent.ts              # RecentResult, RecentEntry, UnreadResult
  utils/
    errors.ts              # ObiError, wrapCommand, handleError
    output.ts              # output(), outputJson()
    vault.ts               # vault discovery, path resolution, config loading
    parser.ts              # YAML frontmatter, wiki-link, heading extraction
```

## Dependencies

| Package | What for |
|---|---|
| `commander` | CLI framework |
| `zod` | Schema validation and type inference |
| `@toon-format/toon` | Default output format |
| `yaml` | YAML frontmatter parsing |

Dev dependencies: `@types/bun`.

## Design Decisions

1. **TOON default, JSON opt-in.** Every command outputs TOON. `--json` flag switches to JSON. Matches dora's pattern.
2. **Read-only.** Obsidian owns the data. We never write to vault files or `.obsidian/`.
3. **No caching.** Vaults are small (30-50 files, <1MB). Parse on every invocation. Revisit if vaults grow.
4. **Backlinks computed on the fly.** `read` and `links` scan all notes for wiki-links pointing to the target. Cheap at this scale.
5. **Section extraction uses heading-level parsing.** `## Bindings` ends at the next `##` or EOF. Not regex.
6. **Commands return typed objects, never print.** Action handlers call command functions, get data back, pass to `output()`.
7. **Graceful degradation.** If a plugin isn't installed (no icon-folder, no tasks), those fields come back as empty/null. Never errors.
8. **Generic design.** No vault-specific logic baked in. The CLI discovers what's available from the vault's `.obsidian/` and frontmatter dynamically.

## Build

```bash
bun build src/index.ts --compile --outfile dist/obi
```

## Error Handling

`ObiError` class with optional code and data (matches dora's `CtxError`). Errors go to stderr as JSON, exit code 1. `wrapCommand` wraps every action handler.

Common errors:
- Vault not found (name doesn't match any discovered vault)
- No vaults path (env var not set, iCloud path doesn't exist)
- Note not found (path doesn't resolve to a `.md` file)
- No vault specified (no `--vault`, not in a vault cwd, no default configured)
