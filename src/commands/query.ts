import { collectNotes } from "../utils/vault.ts";
import { parseNote } from "../utils/parser.ts";
import type { CommandContext } from "./shared.ts";
import type { QueryResult } from "../types.ts";

/**
 * Check if a single note's frontmatter matches all filters (AND logic).
 * The `tag` key is special-cased to match against the `tags` array.
 */
export function matchesFilters({
	frontmatter,
	filters,
}: {
	frontmatter: Record<string, unknown>;
	filters: Record<string, string>;
}): boolean {
	return Object.entries(filters).every(([key, value]) => {
		if (key === "tag") {
			if (Array.isArray(frontmatter.tags)) {
				return frontmatter.tags.some(
					(t) => typeof t === "string" && t === value,
				);
			}
			return false;
		}
		const fieldValue = frontmatter[key];
		if (Array.isArray(fieldValue)) {
			return fieldValue.some((v) => String(v) === value);
		}
		return String(fieldValue) === value;
	});
}

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
			if (matchesFilters({ frontmatter: parsed.frontmatter, filters })) {
				results.push({ path: notePath, frontmatter: parsed.frontmatter });
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
