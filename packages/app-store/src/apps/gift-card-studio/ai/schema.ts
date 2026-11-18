import * as z from "zod";
import { designSchema, type DesignValue } from "../designer/lib/schema";
import type { Design } from "../designer/lib/types";
import { normalizeGiftCardDesignPayload } from "./normalize-design";

const imageQuerySchema = z.object({
  id: z.string().min(1),
  query: z.string().min(1).max(200),
});

/** Structured model output for gift card designer AI. */
export const giftCardAiProposalSchema = z.object({
  design: designSchema,
  /**
   * Suggested saved-design name (form field). Required by prompt when creating
   * a new / unnamed design; max matches designSchemaBase.name.
   */
  name: z.string().trim().min(1).max(64).optional(),
  /**
   * Stock photo search queries keyed by element id (image elements).
   * Client resolves Unsplash URLs into element.src before applying.
   */
  imageQueries: z.array(imageQuerySchema).max(12).optional(),
  /** Stock query for canvas.background.image when type is image. */
  canvasBackgroundImageQuery: z.string().min(1).max(200).optional(),
  summary: z.string().max(500).optional(),
});

export type GiftCardAiProposal = z.infer<typeof giftCardAiProposalSchema>;
export type GiftCardAiDesign = DesignValue;

/** Fill temporary image srcs so designSchema can validate before client stock resolve. */
function hydratePendingImageSrcs(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;

  const root = value as Record<string, unknown>;
  const design = root.design;
  if (!design || typeof design !== "object") return value;

  const nextDesign = structuredClone(design) as {
    canvas?: {
      background?: {
        type?: string;
        image?: { src?: string; fit?: string; position?: string };
      };
    };
    elements?: Array<{ type?: string; id?: string; src?: string }>;
  };

  const imageQueries = Array.isArray(root.imageQueries)
    ? (root.imageQueries as Array<{ id?: string; query?: string }>)
    : [];

  const queryById = new Map(
    imageQueries
      .filter((entry) => entry?.id && entry?.query)
      .map((entry) => [entry.id as string, entry.query as string]),
  );

  if (Array.isArray(nextDesign.elements)) {
    for (const element of nextDesign.elements) {
      if (element?.type !== "image" || !element.id) continue;

      if (!element.src?.trim() && queryById.has(element.id)) {
        element.src = `pending:${queryById.get(element.id)}`;
      }
    }
  }

  const canvasQuery =
    typeof root.canvasBackgroundImageQuery === "string"
      ? root.canvasBackgroundImageQuery.trim()
      : "";

  if (
    canvasQuery &&
    nextDesign.canvas?.background?.type === "image" &&
    !nextDesign.canvas.background.image?.src?.trim()
  ) {
    nextDesign.canvas.background.image = {
      ...(nextDesign.canvas.background.image ?? {}),
      src: `pending:${canvasQuery}`,
    };
  }

  return { ...root, design: nextDesign };
}

function parseJsonPayload(text: string): unknown {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(trimmed);
  const raw = (fenced?.[1] ?? trimmed).trim();

  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) {
      throw new Error("gift_card_ai_invalid_json");
    }

    return JSON.parse(raw.slice(start, end + 1));
  }
}

function prepareProposalPayload(
  parsed: unknown,
  fallbackCanvas?: Design["canvas"],
): unknown {
  if (!parsed || typeof parsed !== "object") return parsed;

  const root = parsed as Record<string, unknown>;
  const normalizedDesign = normalizeGiftCardDesignPayload(
    root.design,
    fallbackCanvas,
  );

  return hydratePendingImageSrcs({ ...root, design: normalizedDesign });
}

export function parseGiftCardAiProposalText(
  text: string,
  options?: { fallbackCanvas?: Design["canvas"] },
): GiftCardAiProposal {
  const parsed = parseJsonPayload(text);
  return giftCardAiProposalSchema.parse(
    prepareProposalPayload(parsed, options?.fallbackCanvas),
  );
}

export function normalizeGiftCardAiProposal(
  value: unknown,
  options?: { fallbackCanvas?: Design["canvas"] },
): GiftCardAiProposal {
  return giftCardAiProposalSchema.parse(
    prepareProposalPayload(value, options?.fallbackCanvas),
  );
}

export function formatGiftCardAiParseIssues(error: unknown): string {
  if (!(error instanceof z.ZodError)) {
    return error instanceof Error ? error.message : String(error);
  }

  return error.issues
    .slice(0, 20)
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}
