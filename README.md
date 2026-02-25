# obi

Read-only CLI that surfaces structured data from Obsidian vaults for LLM consumption. Default output is TOON, with `--json` fallback.

## Install

```bash
# npm
npm install -g @butttons/obi

# binary (from GitHub releases)
# Download the binary for your platform from the releases page
```

## Usage

```bash
# List available vaults
obi vaults

# Vault structure
obi map --vault Work

# Read a note
obi read "Projects/my-project.md"

# Search vault content
obi search "deployment"

# Filter by frontmatter
obi query --type worker --tag billing
```

## Commands

### Orientation

| Command | Description |
|---|---|
| `obi vaults` | List all available vaults with paths and note counts |
| `obi map` | Vault structure: folders and files with frontmatter metadata |
| `obi context` | Current workspace state: active file, recent files, search, tabs |
| `obi schema` | Property types, types in use, tags in use |

### Navigation

| Command | Description |
|---|---|
| `obi read <path>` | Frontmatter, body, outgoing and incoming links |
| `obi read <path> -s "Heading"` | Extract only the section under a heading |
| `obi toc <path>` | Heading tree for a note |
| `obi links <path>` | Outgoing links, incoming links, 2-hop connections |
| `obi list [folder]` | Folder contents with title, type, tags |

### Query

| Command | Description |
|---|---|
| `obi query --type <value>` | Filter notes by frontmatter fields |
| `obi query --tag <value>` | Filter by tag |
| `obi query -f key=value` | Generic frontmatter filter (repeatable) |
| `obi search <term>` | Content search with file, line, and context |
| `obi recent [--limit N]` | Notes sorted by updated_at |
| `obi unread` | Notes where read: false in frontmatter |

### Global Flags

| Flag | Description |
|---|---|
| `--json` | Output JSON instead of TOON |
| `--vault <name>` | Target vault by name |

## Vault Resolution

1. `DOT_OBSIDIAN_PATH` env var pointing to the vaults parent directory
2. Falls back to `~/Library/Mobile Documents/iCloud~md~obsidian/Documents`
3. If neither exists, errors with setup instructions

When `--vault` is omitted:
1. If cwd is inside a vault, uses that vault
2. Otherwise uses `default_vault` from global config
3. Otherwise errors listing available vaults

## Config

### Global

`~/.config/dot-obsidian/config.json`

```json
{
  "default_vault": "Work",
  "vaults": {
    "Work": { "ignore": ["templates/"] }
  }
}
```

### Per-Vault

`<vault>/.obsidian/dot-obsidian.json`

```json
{
  "ignore": ["templates/"]
}
```

Per-vault config wins over global when both exist.

## Build

```bash
# npm distribution
bun run build:npm

# compiled binary
bun run build

# all platforms
bun run build:all
```

## License

MIT
