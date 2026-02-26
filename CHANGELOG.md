# Changelog

## 0.0.3

- Add `word_count` and `size_bytes` fields to list, map, and read output
- Rename `DOT_OBSIDIAN_PATH` env var to `OBI_VAULTS_PATH`

## 0.0.2

- Rename all config paths from `dot-obsidian` to `obi`
- Global config now at `~/.config/obi/config.json`
- Vault-local config now at `<vault>/.obsidian/obi.json`
- Updated README with install options and binary downloads

## 0.0.1

- Initial release
- Orientation commands: vaults, map, context, schema
- Navigation commands: read, toc, links, list
- Query commands: query, search, recent, unread
- TOON default output with --json fallback
- Vault auto-discovery from iCloud path or OBI_VAULTS_PATH env var
- Per-vault and global config support
