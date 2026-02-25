import { existsSync } from "node:fs";
import { join } from "node:path";
import { collectNotes } from "../utils/vault.ts";
import { parseNote, extractSection, resolveWikiLink } from "../utils/parser.ts";
import { ObiError } from "../utils/errors.ts";
import type { CommandContext } from "./shared.ts";
import type { ReadResult } from "../types.ts";

export async function read({
	ctx,
	notePath,
	section,
}: {
	ctx: CommandContext;
	notePath: string;
	section?: string;
}): Promise<ReadResult> {
	const resolved = notePath.endsWith(".md") ? notePath : `${notePath}.md`;
	const fullPath = join(ctx.vault.path, resolved);

	if (!existsSync(fullPath)) {
		throw new ObiError(`Note not found: ${resolved}`, "NOTE_NOT_FOUND", {
			path: resolved,
		});
	}

	const allNotes = await collectNotes({ vault: ctx.vault });
	const parsed = await parseNote({ vault: ctx.vault, notePath: resolved });

	let body = parsed.body;
	if (section) {
		const extracted = extractSection({ content: body, heading: section });
		if (extracted === null) {
			throw new ObiError(
				`Section "${section}" not found in ${resolved}`,
				"SECTION_NOT_FOUND",
				{ path: resolved, section },
			);
		}
		body = extracted;
	}

	// Compute incoming links (backlinks) by scanning all notes
	const incoming: string[] = [];
	await Promise.all(
		allNotes.map(async (otherPath) => {
			if (otherPath === resolved) return;
			const other = await parseNote({ vault: ctx.vault, notePath: otherPath });
			for (const link of other.outgoingLinks) {
				const resolvedLink = resolveWikiLink({ target: link, allNotes });
				if (resolvedLink === resolved) {
					incoming.push(otherPath);
					break;
				}
			}
		}),
	);

	return {
		path: resolved,
		vault: ctx.vault.name,
		frontmatter: parsed.frontmatter,
		body,
		outgoing_links: parsed.outgoingLinks,
		incoming_links: incoming.sort(),
	};
}
