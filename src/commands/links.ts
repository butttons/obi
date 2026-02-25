import { existsSync } from "node:fs";
import { join } from "node:path";
import { collectNotes } from "../utils/vault.ts";
import { parseNote, resolveWikiLink } from "../utils/parser.ts";
import { ObiError } from "../utils/errors.ts";
import type { CommandContext } from "./shared.ts";
import type { LinksResult } from "../types.ts";

export async function links({
	ctx,
	notePath,
}: {
	ctx: CommandContext;
	notePath: string;
}): Promise<LinksResult> {
	const resolved = notePath.endsWith(".md") ? notePath : `${notePath}.md`;
	const fullPath = join(ctx.vault.path, resolved);

	if (!existsSync(fullPath)) {
		throw new ObiError(`Note not found: ${resolved}`, "NOTE_NOT_FOUND", {
			path: resolved,
		});
	}

	const allNotes = await collectNotes({ vault: ctx.vault });
	const parsed = await parseNote({ vault: ctx.vault, notePath: resolved });

	// Build a link map for all notes (needed for backlinks and 2-hop)
	const linkMap = new Map<string, string[]>();
	await Promise.all(
		allNotes.map(async (np) => {
			const note = await parseNote({ vault: ctx.vault, notePath: np });
			const resolvedLinks = note.outgoingLinks
				.map((link) => resolveWikiLink({ target: link, allNotes }))
				.filter((l): l is string => l !== null);
			linkMap.set(np, resolvedLinks);
		}),
	);

	// Outgoing: resolved links from the target note
	const outgoing = (linkMap.get(resolved) ?? []).sort();

	// Incoming: notes that link to the target
	const incoming: string[] = [];
	for (const [notePath, noteLinks] of linkMap) {
		if (notePath === resolved) continue;
		if (noteLinks.includes(resolved)) {
			incoming.push(notePath);
		}
	}
	incoming.sort();

	// Two-hop: notes reachable through one intermediate note (excluding self and direct links)
	const directConnections = new Set([resolved, ...outgoing, ...incoming]);
	const twoHopSet = new Set<string>();

	// From outgoing neighbors
	for (const neighbor of outgoing) {
		const neighborLinks = linkMap.get(neighbor) ?? [];
		for (const hop of neighborLinks) {
			if (!directConnections.has(hop)) {
				twoHopSet.add(hop);
			}
		}
		// Also check who links to the neighbor
		for (const [np, nl] of linkMap) {
			if (np !== resolved && nl.includes(neighbor) && !directConnections.has(np)) {
				twoHopSet.add(np);
			}
		}
	}

	// From incoming neighbors
	for (const neighbor of incoming) {
		const neighborLinks = linkMap.get(neighbor) ?? [];
		for (const hop of neighborLinks) {
			if (!directConnections.has(hop)) {
				twoHopSet.add(hop);
			}
		}
	}

	return {
		path: resolved,
		vault: ctx.vault.name,
		outgoing,
		incoming,
		two_hop: [...twoHopSet].sort(),
	};
}
