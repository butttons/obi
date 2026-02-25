import { readObsidianJson, collectNotes } from "../utils/vault.ts";
import { parseNote } from "../utils/parser.ts";
import type { CommandContext } from "./shared.ts";
import type { SchemaResult } from "../types.ts";

type TypesJson = {
	types?: Record<string, string>;
};

export async function schema({ ctx }: { ctx: CommandContext }): Promise<SchemaResult> {
	const typesJson = await readObsidianJson<TypesJson>({
		vault: ctx.vault,
		filename: "types.json",
	});

	const properties = Object.entries(typesJson?.types ?? {}).map(
		([name, type]) => ({ name, type }),
	);

	// Scan all notes for types and tags in use
	const notes = await collectNotes({ vault: ctx.vault });
	const typesInUse = new Set<string>();
	const tagsInUse = new Set<string>();

	await Promise.all(
		notes.map(async (notePath) => {
			const parsed = await parseNote({ vault: ctx.vault, notePath });
			const fm = parsed.frontmatter;

			if (typeof fm.type === "string" && fm.type) {
				typesInUse.add(fm.type);
			}

			if (Array.isArray(fm.tags)) {
				for (const tag of fm.tags) {
					if (typeof tag === "string" && tag) {
						tagsInUse.add(tag);
					}
				}
			}
		}),
	);

	return {
		vault: ctx.vault.name,
		properties,
		types_in_use: [...typesInUse].sort(),
		tags_in_use: [...tagsInUse].sort(),
	};
}
