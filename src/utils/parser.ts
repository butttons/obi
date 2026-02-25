import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import type { VaultContext } from "./vault.ts";

export type ParsedNote = {
	path: string;
	frontmatter: Record<string, unknown>;
	body: string;
	outgoingLinks: string[];
	headings: Array<{ level: number; text: string; line: number }>;
};

/**
 * Parse a single markdown note: frontmatter, body, wiki-links, headings.
 */
export async function parseNote({
	vault,
	notePath,
}: {
	vault: VaultContext;
	notePath: string;
}): Promise<ParsedNote> {
	const fullPath = join(vault.path, notePath);
	const file = Bun.file(fullPath);
	const content = await file.text();

	const { frontmatter, body } = extractFrontmatter({ content });
	const outgoingLinks = extractWikiLinks({ content: body });
	const headings = extractHeadings({ content: body });

	return { path: notePath, frontmatter, body, outgoingLinks, headings };
}

/**
 * Extract YAML frontmatter and body from markdown content.
 */
export function extractFrontmatter({ content }: { content: string }): {
	frontmatter: Record<string, unknown>;
	body: string;
} {
	if (!content.startsWith("---")) {
		return { frontmatter: {}, body: content };
	}

	const endIndex = content.indexOf("\n---", 3);
	if (endIndex === -1) {
		return { frontmatter: {}, body: content };
	}

	const yamlBlock = content.slice(4, endIndex);
	const body = content.slice(endIndex + 4).trimStart();

	try {
		const parsed = parseYaml(yamlBlock);
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
			return { frontmatter: parsed as Record<string, unknown>, body };
		}
		return { frontmatter: {}, body };
	} catch {
		return { frontmatter: {}, body: content };
	}
}

/**
 * Extract wiki-links ([[target]] or [[target|alias]]) from content.
 * Returns unique link targets (without aliases).
 */
export function extractWikiLinks({ content }: { content: string }): string[] {
	const regex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
	const links = new Set<string>();
	let match: RegExpExecArray | null;

	while ((match = regex.exec(content)) !== null) {
		const target = match[1]?.trim();
		if (target) {
			links.add(target);
		}
	}

	return [...links];
}

/**
 * Extract headings from markdown content.
 * Line numbers are relative to the body (after frontmatter).
 */
export function extractHeadings({ content }: { content: string }): Array<{
	level: number;
	text: string;
	line: number;
}> {
	const headings: Array<{ level: number; text: string; line: number }> = [];
	const lines = content.split("\n");

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		const match = line.match(/^(#{1,6})\s+(.+)$/);
		if (match) {
			headings.push({
				level: match[1]!.length,
				text: match[2]!.trim(),
				line: i + 1,
			});
		}
	}

	return headings;
}

/**
 * Extract a section under a specific heading.
 * Returns content from the heading line to the next heading of equal or higher level, or EOF.
 */
export function extractSection({
	content,
	heading,
}: {
	content: string;
	heading: string;
}): string | null {
	const lines = content.split("\n");
	let isCapturing = false;
	let captureLevel = 0;
	const captured: string[] = [];

	for (const line of lines) {
		const match = line.match(/^(#{1,6})\s+(.+)$/);

		if (match) {
			const level = match[1]!.length;
			const text = match[2]!.trim();

			if (isCapturing) {
				// Stop at same or higher level heading
				if (level <= captureLevel) {
					break;
				}
			}

			if (text === heading) {
				isCapturing = true;
				captureLevel = level;
				captured.push(line);
				continue;
			}
		}

		if (isCapturing) {
			captured.push(line);
		}
	}

	if (captured.length === 0) {
		return null;
	}

	return captured.join("\n").trimEnd();
}

/**
 * Resolve a wiki-link target to a file path.
 * Obsidian links can omit .md extension and can be just a filename (shortest unique match).
 */
export function resolveWikiLink({
	target,
	allNotes,
}: {
	target: string;
	allNotes: string[];
}): string | null {
	// Direct match with .md
	const withExt = target.endsWith(".md") ? target : `${target}.md`;
	if (allNotes.includes(withExt)) {
		return withExt;
	}

	// Match by filename (shortest path match)
	const targetFilename = withExt.split("/").pop()!;
	const matches = allNotes.filter((note) => {
		const noteFilename = note.split("/").pop()!;
		return noteFilename === targetFilename;
	});

	if (matches.length === 1) {
		return matches[0]!;
	}

	// Multiple matches -- try to find one that ends with the full target path
	if (matches.length > 1) {
		const exact = matches.find((note) => note.endsWith(withExt));
		if (exact) {
			return exact;
		}
	}

	return null;
}
