# obi

Read-only CLI that surfaces structured data from Obsidian vaults for LLM consumption. Default output is TOON, with `--json` fallback.

## System Requirements

- **Binary users**: No dependencies -- standalone executable
- **Package manager**: [Bun](https://bun.sh) runtime required
- **Supported OS**: macOS, Linux, Windows

## Installation

### Option 1: Package Manager

Requires [Bun](https://bun.sh) runtime.

```bash
bun add -g @butttons/obi
```

### Option 2: Pre-built Binary

Download the latest binary for your platform from the [releases page](https://github.com/butttons/obi/releases):

```bash
# macOS (ARM64)
curl -L https://github.com/butttons/obi/releases/latest/download/obi-darwin-arm64 -o obi
chmod +x obi
sudo mv obi /usr/local/bin/

# macOS (Intel)
curl -L https://github.com/butttons/obi/releases/latest/download/obi-darwin-x64 -o obi
chmod +x obi
sudo mv obi /usr/local/bin/

# Linux
curl -L https://github.com/butttons/obi/releases/latest/download/obi-linux-x64 -o obi
chmod +x obi
sudo mv obi /usr/local/bin/

# Windows
# Download obi-windows-x64.exe from the releases page and add to PATH
```

### Option 3: Build from Source

```bash
git clone https://github.com/butttons/obi.git
cd obi
bun install
bun run build
sudo mv dist/obi /usr/local/bin/
```

## Updating

### Package Manager

```bash
bun add -g @butttons/obi@latest
```

### Binary

Re-run the curl command from [Option 2](#option-2-pre-built-binary) to download the latest release.

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

1. `OBI_VAULTS_PATH` env var pointing to the vaults parent directory
2. Falls back to `~/Library/Mobile Documents/iCloud~md~obsidian/Documents`
3. If neither exists, errors with setup instructions

When `--vault` is omitted:
1. If cwd is inside a vault, uses that vault
2. Otherwise uses `default_vault` from global config
3. Otherwise errors listing available vaults

## Config

### Global

`~/.config/obi/config.json`

```json
{
  "default_vault": "Work",
  "vaults": {
    "Work": { "ignore": ["templates/"] }
  }
}
```

### Per-Vault

`<vault>/.obsidian/obi.json`

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
