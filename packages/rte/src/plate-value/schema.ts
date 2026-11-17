import * as z from "zod";

/** Block types used in page/email Text `props.value` (Plate). */
export const PLATE_BODY_BLOCK_TYPES = [
  "p",
  "ul",
  "ol",
  "li",
  "lic",
  "a",
  "blockquote",
] as const;

export type PlateBodyBlockType = (typeof PLATE_BODY_BLOCK_TYPES)[number];

const plateTextLeafSchema = z
  .object({
    text: z.string(),
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    underline: z.boolean().optional(),
    strikethrough: z.boolean().optional(),
    code: z.boolean().optional(),
  })
  .passthrough();

export type PlateBodyNode =
  | z.infer<typeof plateTextLeafSchema>
  | PlateBodyElement;

export type PlateBodyElement = {
  type: string;
  children: PlateBodyNode[];
  url?: string;
  [key: string]: unknown;
};

export const plateBodyNodeSchema: z.ZodType<PlateBodyNode> = z.lazy(() =>
  z.union([
    plateTextLeafSchema,
    z
      .object({
        type: z.enum(PLATE_BODY_BLOCK_TYPES),
        children: z.array(plateBodyNodeSchema),
        url: z.string().optional(),
      })
      .passthrough(),
  ]),
);

/**
 * Text / rich-body value for builders.
 * AI may pass markdown (preferred) or Plate nodes; hydrate normalizes either.
 */
export const plateBodyValueSchema = z
  .union([
    z
      .string()
      .describe(
        'Markdown body copy (preferred for AI). Paragraphs, "- "/numbered lists, **bold**, _italic_, [label](url) links. Do not use # headings — titles belong in Heading blocks. Converted to Plate on apply.',
      ),
    z
      .array(plateBodyNodeSchema)
      .describe(
        'Plate nodes. Paragraph type MUST be "p" (never "paragraph"). Lists: ul|ol → li → lic → text leaves. Links: { type:"a", url, children }.',
      ),
  ])
  .nullable()
  .optional();

export type PlateBodyValue = z.infer<typeof plateBodyValueSchema>;
