import { join } from "node:path";
import { collectNotes } from "../utils/vault.ts";
import type { CommandContext } from "./shared.ts";
import type { SearchResult } from "../types.ts";

export async function search({
	ctx,
	term,
}: {
	ctx: CommandContext;
	term: string;
}): Promise<SearchResult> {
	const allNotes = await collectNotes({ vault: ctx.vault });
	const lowerTerm = term.toLowerCase();
	const matches: Array<{ path: string; line: number; text: string }> = [];

	await Promise.all(
		allNotes.map(async (notePath) => {
			const fullPath = join(ctx.vault.path, notePath);
			const file = Bun.file(fullPath);
			const content = await file.text();
			const lines = content.split("\n");

			for (let i = 0; i < lines.length; i++) {
				if (lines[i]!.toLowerCase().includes(lowerTerm)) {
					matches.push({
						path: notePath,
						line: i + 1,
						text: lines[i]!.trim(),
					});
				}
			}
		}),
	);

	// Sort by path then line for stable output
	matches.sort((a, b) => {
		const pathCmp = a.path.localeCompare(b.path);
		if (pathCmp !== 0) return pathCmp;
		return a.line - b.line;
	});

	return {
		vault: ctx.vault.name,
		term,
		matches,
	};
}
