import { collectNotes } from "../utils/vault.ts";
import { parseNote } from "../utils/parser.ts";
import type { CommandContext } from "./shared.ts";
import type { QueryResult } from "../types.ts";

export async function query({
	ctx,
	filters,
}: {
	ctx: CommandContext;
	filters: Record<string, string>;
}): Promise<QueryResult> {
	const allNotes = await collectNotes({ vault: ctx.vault });

	const results: Array<{ path: string; frontmatter: Record<string, unknown> }> = [];

	await Promise.all(
		allNotes.map(async (notePath) => {
			const parsed = await parseNote({ vault: ctx.vault, notePath });
			const fm = parsed.frontmatter;

			const isMatch = Object.entries(filters).every(([key, value]) => {
				if (key === "tag") {
					// Special handling: match against tags array
					if (Array.isArray(fm.tags)) {
						return fm.tags.some(
							(t) => typeof t === "string" && t === value,
						);
					}
					return false;
				}
				// Generic frontmatter field match
				const fieldValue = fm[key];
				if (Array.isArray(fieldValue)) {
					return fieldValue.some((v) => String(v) === value);
				}
				return String(fieldValue) === value;
			});

			if (isMatch) {
				results.push({ path: notePath, frontmatter: fm });
			}
		}),
	);

	// Sort by path for stable output
	results.sort((a, b) => a.path.localeCompare(b.path));

	return {
		vault: ctx.vault.name,
		filters,
		results,
	};
}
