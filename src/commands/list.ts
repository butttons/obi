import { collectNotes } from "../utils/vault.ts";
import { parseNote } from "../utils/parser.ts";
import type { CommandContext } from "./shared.ts";
import type { ListResult } from "../types.ts";

export async function list({
	ctx,
	folder,
}: {
	ctx: CommandContext;
	folder?: string;
}): Promise<ListResult> {
	const allNotes = await collectNotes({ vault: ctx.vault });
	const targetFolder = folder ?? ".";

	// Filter notes to the target folder
	const filtered =
		targetFolder === "."
			? allNotes
			: allNotes.filter((n) => n.startsWith(targetFolder + "/"));

	const entries = await Promise.all(
		filtered.map(async (notePath) => {
			const parsed = await parseNote({ vault: ctx.vault, notePath });
			const fm = parsed.frontmatter;
			const tags = Array.isArray(fm.tags)
				? fm.tags.filter((t): t is string => typeof t === "string")
				: [];

			return {
				path: parsed.path,
				title: (fm.title as string) ?? null,
				type: (fm.type as string) ?? null,
				tags,
				word_count: parsed.body.split(/\s+/).filter(Boolean).length,
				size_bytes: Buffer.byteLength(parsed.body, "utf-8"),
			};
		}),
	);

	return {
		vault: ctx.vault.name,
		folder: targetFolder,
		entries,
	};
}
