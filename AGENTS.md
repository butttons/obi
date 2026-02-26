# obi

Read-only CLI that surfaces structured data from Obsidian vaults for LLM consumption. Entry point is `src/index.ts`.

## Architecture

Commands return typed objects. They never print directly. The action handler calls the command function, gets data back, passes it to `output()`. TOON is the default output format; `--json` flag switches to JSON.

All commands go through `setupCommand()` which resolves the vault. The vault resolution chain is: explicit `--vault` flag, then cwd detection, then `default_vault` from global config, then error.

## Data Sources

obi reads from two places: note files and `.obsidian/` plugin data.

Note files provide: YAML frontmatter, wiki-links (directed graph), headings (document structure).

`.obsidian/` files consumed:
- `plugins/obsidian-icon-folder/data.json` -- icons and colors per file/folder (used by `map`)
- `types.json` -- property schema (used by `schema`)
- `workspace.json` -- active file, recent files, last search, open tabs (used by `context`)
- `plugins/obsidian-tasks-plugin/data.json` -- task statuses (used by `schema`)
- `templates.json` -- templates folder name, auto-ignored
- `core-plugins.json` -- which features are enabled

## Design Decisions

- **Read-only.** Obsidian owns the data. Never write to vault files or `.obsidian/`.
- **No caching.** Vaults are small (30-50 files). Parse on every invocation. Revisit if vaults grow past that.
- **Backlinks computed on the fly.** `read` and `links` scan all notes for wiki-links pointing to the target. Cheap at this scale.
- **Section extraction uses heading-level parsing.** `## Heading` ends at the next `##` or higher, or EOF. Not regex.
- **Graceful degradation.** Missing plugins (no icon-folder, no tasks) return empty/null. Never error on missing optional data.
- **Generic design.** No vault-specific logic. Discovers what's available from `.obsidian/` and frontmatter dynamically.

## Ignore Patterns

Hard-coded (always): `.obsidian/`, `.git/`, `.pi/`, `node_modules/`.

The templates folder (from `.obsidian/templates.json`) is auto-ignored.

Per-vault ignore from config is additive. If both local (`<vault>/.obsidian/obi.json`) and global (`~/.config/obi/config.json`) config exist, local wins for ignore patterns.

## Config

Global config lives at `~/.config/obi/config.json`. Vault-local config lives at `<vault>/.obsidian/obi.json`. Local config takes precedence over global for the same vault.

## Error Handling

`ObiError` class with optional `code` and `data` fields. Errors go to stderr as JSON, exit code 1. Every action handler is wrapped with `wrapCommand()`.

The command wrapper uses `any` for args because Commander passes variadic positional + options arguments. This is the one place `any` is acceptable.

## Wiki-Link Resolution

Obsidian links can omit `.md` extensions and can be just a filename (shortest unique match). Resolution order:
1. Direct match with `.md` extension
2. Match by filename (shortest unique path)
3. Multiple matches -- prefer the one ending with the full target path

## Vault Path Resolution

1. `OBI_VAULTS_PATH` env var
2. `~/Library/Mobile Documents/iCloud~md~obsidian/Documents`
3. Error with setup instructions
