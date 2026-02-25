import { collectNotes } from "../utils/vault.ts";
import { parseNote } from "../utils/parser.ts";
import type { CommandContext } from "./shared.ts";
import type { UnreadResult } from "../types.ts";

export async function unread({ ctx }: { ctx: CommandContext }): Promise<UnreadResult> {
	const allNotes = await collectNotes({ vault: ctx.vault });

	const entries: Array<{ path: string; frontmatter: Record<string, unknown> }> = [];

	await Promise.all(
		allNotes.map(async (notePath) => {
			const parsed = await parseNote({ vault: ctx.vault, notePath });
			const fm = parsed.frontmatter;

			// Only include notes that explicitly have read: false
			if (fm.read === false) {
				entries.push({ path: notePath, frontmatter: fm });
			}
		}),
	);

	entries.sort((a, b) => a.path.localeCompare(b.path));

	return {
		vault: ctx.vault.name,
		entries,
	};
}
