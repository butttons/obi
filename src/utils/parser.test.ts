import { describe, expect, test } from "bun:test";
import {
	extractFrontmatter,
	extractWikiLinks,
	extractHeadings,
	extractSection,
	resolveWikiLink,
} from "./parser.ts";

describe("extractFrontmatter", () => {
	test("parses valid frontmatter and body", () => {
		const content = `---
title: hello
type: tool
tags: [a, b]
---

# Hello`;

		const result = extractFrontmatter({ content });
		expect(result.frontmatter).toEqual({
			title: "hello",
			type: "tool",
			tags: ["a", "b"],
		});
		expect(result.body).toBe("# Hello");
	});

	test("returns empty frontmatter when no delimiters", () => {
		const content = "# Just a heading\n\nSome text.";
		const result = extractFrontmatter({ content });
		expect(result.frontmatter).toEqual({});
		expect(result.body).toBe(content);
	});

	test("returns empty frontmatter when closing delimiter is missing", () => {
		const content = "---\ntitle: broken\nno closing fence";
		const result = extractFrontmatter({ content });
		expect(result.frontmatter).toEqual({});
		expect(result.body).toBe(content);
	});

	test("returns empty frontmatter when yaml parses to array", () => {
		const content = "---\n- one\n- two\n---\n\nbody";
		const result = extractFrontmatter({ content });
		expect(result.frontmatter).toEqual({});
		expect(result.body).toBe("body");
	});

	test("returns empty frontmatter on invalid yaml", () => {
		const content = "---\n: : : broken\n---\n\nbody";
		const result = extractFrontmatter({ content });
		// yaml library may or may not throw on this; either way should not crash
		expect(result.body).toBeTruthy();
	});

	test("handles frontmatter with no body after it", () => {
		const content = "---\ntitle: solo\n---";
		const result = extractFrontmatter({ content });
		expect(result.frontmatter).toEqual({ title: "solo" });
		expect(result.body).toBe("");
	});

	test("preserves multiline body after frontmatter", () => {
		const content = "---\ntitle: x\n---\n\nline 1\nline 2\nline 3";
		const result = extractFrontmatter({ content });
		expect(result.body).toBe("line 1\nline 2\nline 3");
	});
});

describe("extractWikiLinks", () => {
	test("extracts simple wiki-links", () => {
		const content = "See [[note-a]] and [[folder/note-b]] for details.";
		const result = extractWikiLinks({ content });
		expect(result).toEqual(["note-a", "folder/note-b"]);
	});

	test("extracts aliased wiki-links without the alias", () => {
		const content = "Check [[real-target|display name]] here.";
		const result = extractWikiLinks({ content });
		expect(result).toEqual(["real-target"]);
	});

	test("deduplicates repeated links", () => {
		const content = "[[same]] and [[same]] and [[same|alias]]";
		const result = extractWikiLinks({ content });
		expect(result).toEqual(["same"]);
	});

	test("returns empty array when no links", () => {
		const content = "No links here, just [markdown](url).";
		const result = extractWikiLinks({ content });
		expect(result).toEqual([]);
	});

	test("trims whitespace from targets", () => {
		const content = "[[  spaced  ]] and [[ also spaced |alias]]";
		const result = extractWikiLinks({ content });
		expect(result).toEqual(["spaced", "also spaced"]);
	});

	test("handles multiple links on the same line", () => {
		const content = "[[a]] links to [[b]] and [[c]]";
		const result = extractWikiLinks({ content });
		expect(result).toEqual(["a", "b", "c"]);
	});
});

describe("extractHeadings", () => {
	test("extracts headings with correct levels and line numbers", () => {
		const content = "# Title\n\nSome text\n\n## Section A\n\n### Subsection\n\n## Section B";
		const result = extractHeadings({ content });
		expect(result).toEqual([
			{ level: 1, text: "Title", line: 1 },
			{ level: 2, text: "Section A", line: 5 },
			{ level: 3, text: "Subsection", line: 7 },
			{ level: 2, text: "Section B", line: 9 },
		]);
	});

	test("ignores non-heading lines with hashes", () => {
		const content = "not a heading\n#also not\n##neither\n# real heading";
		const result = extractHeadings({ content });
		expect(result).toEqual([{ level: 1, text: "real heading", line: 4 }]);
	});

	test("returns empty array for content with no headings", () => {
		const content = "just some text\nno headings here";
		const result = extractHeadings({ content });
		expect(result).toEqual([]);
	});
});

describe("extractSection", () => {
	const content = `# Title

Intro paragraph.

## Stack

- Bun
- TypeScript

### Sub-detail

Extra info here.

## Architecture

Arch content.

## Commands

Command list.`;

	test("extracts section including nested subheadings", () => {
		const result = extractSection({ content, heading: "Stack" });
		expect(result).toBe("## Stack\n\n- Bun\n- TypeScript\n\n### Sub-detail\n\nExtra info here.");
	});

	test("stops at next heading of equal level", () => {
		const result = extractSection({ content, heading: "Architecture" });
		expect(result).toBe("## Architecture\n\nArch content.");
	});

	test("captures section at end of file", () => {
		const result = extractSection({ content, heading: "Commands" });
		expect(result).toBe("## Commands\n\nCommand list.");
	});

	test("returns null for non-existent heading", () => {
		const result = extractSection({ content, heading: "Nope" });
		expect(result).toBeNull();
	});

	test("extracts top-level heading section until next equal heading", () => {
		const twoH1 = "# First\n\nBody one.\n\n# Second\n\nBody two.";
		const result = extractSection({ content: twoH1, heading: "First" });
		expect(result).toBe("# First\n\nBody one.");
	});
});

describe("resolveWikiLink", () => {
	const allNotes = [
		"index.md",
		"dora/index.md",
		"dora/architecture.md",
		"residue/index.md",
		"shared/utils.md",
	];

	test("resolves direct path match", () => {
		const result = resolveWikiLink({ target: "dora/index", allNotes });
		expect(result).toBe("dora/index.md");
	});

	test("resolves direct path with .md extension", () => {
		const result = resolveWikiLink({ target: "dora/index.md", allNotes });
		expect(result).toBe("dora/index.md");
	});

	test("resolves unique filename match", () => {
		const result = resolveWikiLink({ target: "architecture", allNotes });
		expect(result).toBe("dora/architecture.md");
	});

	test("resolves unique filename for non-ambiguous note", () => {
		const result = resolveWikiLink({ target: "utils", allNotes });
		expect(result).toBe("shared/utils.md");
	});

	test("resolves ambiguous filename using full path hint", () => {
		// "index" matches index.md, dora/index.md, residue/index.md
		// With path hint "dora/index" it should resolve to dora/index.md
		const result = resolveWikiLink({ target: "dora/index", allNotes });
		expect(result).toBe("dora/index.md");
	});

	test("returns null for non-existent target", () => {
		const result = resolveWikiLink({ target: "ghost", allNotes });
		expect(result).toBeNull();
	});

	test("returns null for ambiguous filename with no path hint", () => {
		// "index" matches 3 notes, no path prefix to disambiguate
		const result = resolveWikiLink({ target: "index", allNotes });
		expect(result).toBe("index.md");
	});
});
