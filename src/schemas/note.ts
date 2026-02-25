import { z } from "zod/v4";

export const ReadResultSchema = z.object({
	path: z.string(),
	vault: z.string(),
	frontmatter: z.record(z.string(), z.unknown()),
	body: z.string(),
	outgoing_links: z.array(z.string()),
	incoming_links: z.array(z.string()),
});

export const HeadingSchema = z.object({
	level: z.number(),
	text: z.string(),
	line: z.number(),
});

export const TocResultSchema = z.object({
	path: z.string(),
	vault: z.string(),
	headings: z.array(HeadingSchema),
});

export const LinksResultSchema = z.object({
	path: z.string(),
	vault: z.string(),
	outgoing: z.array(z.string()),
	incoming: z.array(z.string()),
	two_hop: z.array(z.string()),
});
