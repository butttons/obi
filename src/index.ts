#!/usr/bin/env bun

import { Command } from "commander";
import { wrapCommand } from "./utils/errors.ts";
import { output } from "./utils/output.ts";
import { setupCommand } from "./commands/shared.ts";
import { vaults } from "./commands/vaults.ts";
import { map } from "./commands/map.ts";
import { context } from "./commands/context.ts";
import { schema } from "./commands/schema.ts";
import { read } from "./commands/read.ts";
import { toc } from "./commands/toc.ts";
import { links } from "./commands/links.ts";
import { list } from "./commands/list.ts";
import { query } from "./commands/query.ts";
import { search } from "./commands/search.ts";
import { recent } from "./commands/recent.ts";
import { unread } from "./commands/unread.ts";

import packageJson from "../package.json";

const program = new Command();

program
	.name("obi")
	.description("Obsidian vault CLI for LLM consumption")
	.version(packageJson.version ?? "0.0.0")
	.option("--json", "Output in JSON format")
	.option("--vault <name>", "Target vault name");

/** Orientation commands */

program
	.command("vaults")
	.description("List all available vaults with paths and note counts")
	.action(
		wrapCommand(async () => {
			const result = await vaults();
			output({ data: result, isJson: program.opts().json });
		}),
	);

program
	.command("map")
	.description("Vault structure: folders and files with frontmatter metadata")
	.action(
		wrapCommand(async () => {
			const ctx = await setupCommand({ vaultName: program.opts().vault });
			const result = await map({ ctx });
			output({ data: result, isJson: program.opts().json });
		}),
	);

program
	.command("context")
	.description("Current workspace state: active file, recent files, search, tabs")
	.action(
		wrapCommand(async () => {
			const ctx = await setupCommand({ vaultName: program.opts().vault });
			const result = await context({ ctx });
			output({ data: result, isJson: program.opts().json });
		}),
	);

program
	.command("schema")
	.description("Property types, types in use, tags in use")
	.action(
		wrapCommand(async () => {
			const ctx = await setupCommand({ vaultName: program.opts().vault });
			const result = await schema({ ctx });
			output({ data: result, isJson: program.opts().json });
		}),
	);

/** Navigation commands */

program
	.command("read <path>")
	.description("Read a note: frontmatter, body, outgoing and incoming links")
	.option("-s, --section <heading>", "Extract only the section under this heading")
	.action(
		wrapCommand(async (notePath: string, options: { section?: string }) => {
			const ctx = await setupCommand({ vaultName: program.opts().vault });
			const result = await read({ ctx, notePath, section: options.section });
			output({ data: result, isJson: program.opts().json });
		}),
	);

program
	.command("toc <path>")
	.description("Heading tree for a note")
	.action(
		wrapCommand(async (notePath: string) => {
			const ctx = await setupCommand({ vaultName: program.opts().vault });
			const result = await toc({ ctx, notePath });
			output({ data: result, isJson: program.opts().json });
		}),
	);

program
	.command("links <path>")
	.description("Outgoing links, incoming links (backlinks), 2-hop connections")
	.action(
		wrapCommand(async (notePath: string) => {
			const ctx = await setupCommand({ vaultName: program.opts().vault });
			const result = await links({ ctx, notePath });
			output({ data: result, isJson: program.opts().json });
		}),
	);

program
	.command("list [folder]")
	.description("Folder contents with title, type, tags from frontmatter")
	.action(
		wrapCommand(async (folder?: string) => {
			const ctx = await setupCommand({ vaultName: program.opts().vault });
			const result = await list({ ctx, folder });
			output({ data: result, isJson: program.opts().json });
		}),
	);

/** Query commands */

program
	.command("query")
	.description("Filter notes by frontmatter field values")
	.option("--type <value>", "Filter by type field")
	.option("--tag <value>", "Filter by tag")
	.option("--status <value>", "Filter by status field")
	.option("-f, --filter <key=value>", "Generic frontmatter filter (repeatable)", collectFilter, {})
	.action(
		wrapCommand(async (options: { type?: string; tag?: string; status?: string; filter: Record<string, string> }) => {
			const ctx = await setupCommand({ vaultName: program.opts().vault });
			const filters: Record<string, string> = { ...options.filter };
			if (options.type) filters.type = options.type;
			if (options.tag) filters.tag = options.tag;
			if (options.status) filters.status = options.status;
			const result = await query({ ctx, filters });
			output({ data: result, isJson: program.opts().json });
		}),
	);

program
	.command("search <term>")
	.description("Content search with file, line, and context")
	.action(
		wrapCommand(async (term: string) => {
			const ctx = await setupCommand({ vaultName: program.opts().vault });
			const result = await search({ ctx, term });
			output({ data: result, isJson: program.opts().json });
		}),
	);

program
	.command("recent")
	.description("Notes sorted by updated_at from frontmatter")
	.option("-l, --limit <number>", "Maximum number of results")
	.action(
		wrapCommand(async (options: { limit?: string }) => {
			const ctx = await setupCommand({ vaultName: program.opts().vault });
			const limit = options.limit ? parseInt(options.limit, 10) : undefined;
			const result = await recent({ ctx, limit });
			output({ data: result, isJson: program.opts().json });
		}),
	);

program
	.command("unread")
	.description("Notes where read: false in frontmatter")
	.action(
		wrapCommand(async () => {
			const ctx = await setupCommand({ vaultName: program.opts().vault });
			const result = await unread({ ctx });
			output({ data: result, isJson: program.opts().json });
		}),
	);

program.parse();

/**
 * Collector for repeatable --filter key=value flags.
 */
function collectFilter(
	value: string,
	previous: Record<string, string>,
): Record<string, string> {
	const [key, ...rest] = value.split("=");
	if (key && rest.length > 0) {
		previous[key] = rest.join("=");
	}
	return previous;
}
