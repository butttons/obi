import { existsSync } from "node:fs";
import { join } from "node:path";
import { parseNote } from "../utils/parser.ts";
import { ObiError } from "../utils/errors.ts";
import type { CommandContext } from "./shared.ts";
import type { TocResult } from "../types.ts";

export async function toc({
	ctx,
	notePath,
}: {
	ctx: CommandContext;
	notePath: string;
}): Promise<TocResult> {
	const resolved = notePath.endsWith(".md") ? notePath : `${notePath}.md`;
	const fullPath = join(ctx.vault.path, resolved);

	if (!existsSync(fullPath)) {
		throw new ObiError(`Note not found: ${resolved}`, "NOTE_NOT_FOUND", {
			path: resolved,
		});
	}

	const parsed = await parseNote({ vault: ctx.vault, notePath: resolved });

	return {
		path: resolved,
		vault: ctx.vault.name,
		headings: parsed.headings,
	};
}
