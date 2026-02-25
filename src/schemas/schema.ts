import { z } from "zod/v4";

export const PropertyDefSchema = z.object({
	name: z.string(),
	type: z.string(),
});

export const SchemaResultSchema = z.object({
	vault: z.string(),
	properties: z.array(PropertyDefSchema),
	types_in_use: z.array(z.string()),
	tags_in_use: z.array(z.string()),
});
