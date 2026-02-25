import { describe, expect, test } from "bun:test";
import { isIgnored } from "./vault.ts";

describe("isIgnored", () => {
	const ignorePatterns = [".obsidian", ".git", ".pi", "node_modules", "templates"];

	test("ignores hard-coded directories at root", () => {
		expect(isIgnored({ relativePath: ".obsidian", ignorePatterns })).toBe(true);
		expect(isIgnored({ relativePath: ".git", ignorePatterns })).toBe(true);
		expect(isIgnored({ relativePath: ".pi", ignorePatterns })).toBe(true);
		expect(isIgnored({ relativePath: "node_modules", ignorePatterns })).toBe(true);
	});

	test("ignores files nested inside ignored directories", () => {
		expect(isIgnored({ relativePath: ".obsidian/workspace.json", ignorePatterns })).toBe(true);
		expect(isIgnored({ relativePath: "templates/tool.md", ignorePatterns })).toBe(true);
		expect(isIgnored({ relativePath: "node_modules/zod/index.js", ignorePatterns })).toBe(true);
	});

	test("allows paths that don't match any pattern", () => {
		expect(isIgnored({ relativePath: "dora/index.md", ignorePatterns })).toBe(false);
		expect(isIgnored({ relativePath: "readme.md", ignorePatterns })).toBe(false);
		expect(isIgnored({ relativePath: "folder/deep/note.md", ignorePatterns })).toBe(false);
	});

	test("handles patterns with trailing slashes", () => {
		const patterns = ["templates/", ".obsidian/"];
		expect(isIgnored({ relativePath: "templates/tool.md", ignorePatterns: patterns })).toBe(true);
		expect(isIgnored({ relativePath: ".obsidian/types.json", ignorePatterns: patterns })).toBe(true);
	});

	test("does not match partial directory names", () => {
		expect(isIgnored({ relativePath: "templates-extra/note.md", ignorePatterns })).toBe(false);
		expect(isIgnored({ relativePath: "my-templates/note.md", ignorePatterns })).toBe(false);
	});
});
