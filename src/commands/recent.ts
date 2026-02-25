import { collectNotes } from "../utils/vault.ts";
import { parseNote } from "../utils/parser.ts";
import type { CommandContext } from "./shared.ts";
import type { RecentResult } from "../types.ts";

const DEFAULT_LIMIT = 10;

export async function recent({
	ctx,
	limit,
}: {
	ctx: CommandContext;
	limit?: number;
}): Promise<RecentResult> {
	const allNotes = await collectNotes({ vault: ctx.vault });
	const effectiveLimit = limit ?? DEFAULT_LIMIT;

	const entries: Array<{
		path: string;
		title: string | null;
		updated_at: string | null;
	}> = [];

	await Promise.all(
		allNotes.map(async (notePath) => {
			const parsed = await parseNote({ vault: ctx.vault, notePath });
			const fm = parsed.frontmatter;

			entries.push({
				path: notePath,
				title: (fm.title as string) ?? null,
				updated_at: (fm.updated_at as string) ?? null,
			});
		}),
	);

	// Sort by updated_at descending (nulls last)
	entries.sort((a, b) => {
		if (a.updated_at === null && b.updated_at === null) return 0;
		if (a.updated_at === null) return 1;
		if (b.updated_at === null) return -1;
		return b.updated_at.localeCompare(a.updated_at);
	});

	return {
		vault: ctx.vault.name,
		entries: entries.slice(0, effectiveLimit),
	};
}
