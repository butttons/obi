import { describe, expect, test } from "bun:test";
import { matchesFilters } from "./query.ts";

describe("matchesFilters", () => {
	test("matches a single string field", () => {
		const frontmatter = { type: "tool", status: "active" };
		expect(matchesFilters({ frontmatter, filters: { type: "tool" } })).toBe(true);
		expect(matchesFilters({ frontmatter, filters: { type: "app" } })).toBe(false);
	});

	test("matches tag against tags array", () => {
		const frontmatter = { tags: ["ai", "devtools", "cloudflare"] };
		expect(matchesFilters({ frontmatter, filters: { tag: "ai" } })).toBe(true);
		expect(matchesFilters({ frontmatter, filters: { tag: "billing" } })).toBe(false);
	});

	test("returns false for tag filter when no tags array exists", () => {
		const frontmatter = { type: "tool" };
		expect(matchesFilters({ frontmatter, filters: { tag: "ai" } })).toBe(false);
	});

	test("compound AND: all filters must match", () => {
		const frontmatter = { type: "tool", status: "active", tags: ["ai", "devtools"] };
		expect(
			matchesFilters({ frontmatter, filters: { type: "tool", tag: "ai" } }),
		).toBe(true);
		expect(
			matchesFilters({ frontmatter, filters: { type: "tool", tag: "billing" } }),
		).toBe(false);
		expect(
			matchesFilters({ frontmatter, filters: { type: "app", tag: "ai" } }),
		).toBe(false);
	});

	test("matches against array-valued frontmatter fields", () => {
		const frontmatter = { aliases: ["foo", "bar"] };
		expect(matchesFilters({ frontmatter, filters: { aliases: "foo" } })).toBe(true);
		expect(matchesFilters({ frontmatter, filters: { aliases: "baz" } })).toBe(false);
	});

	test("coerces non-string field values to string for comparison", () => {
		const frontmatter = { read: false, count: 42 };
		expect(matchesFilters({ frontmatter, filters: { read: "false" } })).toBe(true);
		expect(matchesFilters({ frontmatter, filters: { count: "42" } })).toBe(true);
	});

	test("empty filters match everything", () => {
		const frontmatter = { type: "tool" };
		expect(matchesFilters({ frontmatter, filters: {} })).toBe(true);
	});

	test("filter on missing field does not match", () => {
		const frontmatter = { type: "tool" };
		expect(matchesFilters({ frontmatter, filters: { status: "active" } })).toBe(false);
	});
});
