import { collectNotes, collectFolders } from "../utils/vault.ts";
import { parseNote } from "../utils/parser.ts";
import type { CommandContext } from "./shared.ts";
import type { MapResult } from "../types.ts";

export async function map({ ctx }: { ctx: CommandContext }): Promise<MapResult> {
	const notes = await collectNotes({ vault: ctx.vault });
	const folders = await collectFolders({ vault: ctx.vault });

	// Count files per folder
	const folderCounts = new Map<string, number>();
	for (const folder of folders) {
		folderCounts.set(folder, 0);
	}
	for (const note of notes) {
		const parts = note.split("/");
		if (parts.length > 1) {
			// Walk up the folder hierarchy
			for (let i = 1; i < parts.length; i++) {
				const folder = parts.slice(0, i).join("/");
				folderCounts.set(folder, (folderCounts.get(folder) ?? 0) + 1);
			}
		}
	}

	const folderEntries = folders.map((f) => ({
		path: f,
		file_count: folderCounts.get(f) ?? 0,
	}));

	const fileEntries = await Promise.all(
		notes.map(async (notePath) => {
			const parsed = await parseNote({ vault: ctx.vault, notePath });
			return {
				path: parsed.path,
				title: (parsed.frontmatter.title as string) ?? null,
				type: (parsed.frontmatter.type as string) ?? null,
			};
		}),
	);

	return {
		vault: ctx.vault.name,
		folders: folderEntries,
		files: fileEntries,
	};
}
