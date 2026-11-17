import * as z from "zod";

const schemaCache = new Map<string, unknown>();

type ZodLike = {
  def?: {
    type?: string;
    innerType?: ZodLike;
    shape?: Record<string, z.ZodTypeAny>;
  };
  unwrap?: () => ZodLike;
};

const STYLE_STUB = {
  type: "object",
  description:
    "Optional responsive style map. Keys must come from supportedStyles on this result. Do not invent raw CSS. Fetch property schemas via getStyleSchema({ properties, blockType }) and discover names via searchStyleProperties({ query, blockType }). Prefer getDesignTokens for brand colors/fonts.",
  additionalProperties: true,
} as const;

function unwrapZod(schema: ZodLike): ZodLike {
  let current: ZodLike = schema;

  for (let i = 0; i < 8; i++) {
    const type = current.def?.type;

    if (
      type === "optional" ||
      type === "nullable" ||
      type === "default" ||
      type === "prefault"
    ) {
      current = current.def?.innerType ?? current;
      continue;
    }

    if (
      (type === "optional" || type === "nullable") &&
      typeof current.unwrap === "function"
    ) {
      current = current.unwrap();
      continue;
    }

    break;
  }

  return current;
}

function getZodObjectShape(
  schema: z.ZodTypeAny | ZodLike | undefined,
): Record<string, z.ZodTypeAny> | null {
  if (!schema) return null;

  const unwrapped = unwrapZod(schema as ZodLike);

  if (unwrapped.def?.type !== "object" || !unwrapped.def.shape) {
    return null;
  }

  return unwrapped.def.shape;
}

export function extractSupportedStyleProperties(
  schema: z.ZodTypeAny,
): string[] | undefined {
  const rootShape = getZodObjectShape(schema);

  if (!rootShape?.style) return undefined;

  const styleShape = getZodObjectShape(rootShape.style);

  if (!styleShape) return undefined;

  return Object.keys(styleShape).sort();
}

export function zodSchemaToJson(
  schema: z.ZodTypeAny,
  cacheKey?: string,
): unknown {
  if (cacheKey) {
    const cached = schemaCache.get(cacheKey);
    if (cached) return cached;
  }

  let json: unknown;

  try {
    if (typeof (z as any).toJSONSchema === "function") {
      json = (z as any).toJSONSchema(schema);
    } else {
      json = {
        type: "object",
        description: "Schema serialization unavailable; validate server-side.",
        note: schema.description ?? schema.constructor?.name,
      };
    }
  } catch {
    json = {
      type: "object",
      description: "Failed to serialize schema; validate server-side.",
    };
  }

  if (cacheKey) {
    schemaCache.set(cacheKey, json);
  }

  return json;
}

/**
 * AI-facing block schema: full props, style stub + style key names.
 * Avoids inlining huge style JSON that truncates lock/prop fields.
 * Callers enrich style names with catalog descriptions into supportedStyles.
 */
export function blockSchemaForAi(
  schema: z.ZodTypeAny,
  cacheKey?: string,
): {
  schema: unknown;
  supportedStyleProperties?: string[];
} {
  const resolvedCacheKey = cacheKey ? `${cacheKey}:ai` : undefined;

  if (resolvedCacheKey) {
    const cached = schemaCache.get(resolvedCacheKey) as
      | {
          schema: unknown;
          supportedStyleProperties?: string[];
        }
      | undefined;

    if (cached) return cached;
  }

  const rootShape = getZodObjectShape(schema);
  const supportedStyleProperties = extractSupportedStyleProperties(schema);

  let result: {
    schema: unknown;
    supportedStyleProperties?: string[];
  };

  if (!rootShape) {
    result = { schema: zodSchemaToJson(schema) };
  } else {
    const properties: Record<string, unknown> = {};

    if (rootShape.props) {
      properties.props = zodSchemaToJson(
        rootShape.props,
        cacheKey ? `${cacheKey}:props` : undefined,
      );
    }

    if (rootShape.style) {
      properties.style = STYLE_STUB;
    }

    for (const [key, value] of Object.entries(rootShape)) {
      if (key === "props" || key === "style") continue;

      properties[key] = zodSchemaToJson(
        value,
        cacheKey ? `${cacheKey}:field:${key}` : undefined,
      );
    }

    result = {
      schema: {
        type: "object",
        properties,
        description: supportedStyleProperties?.length
          ? "Block data schema. Style value definitions are omitted - use supportedStyles + getStyleSchema. Prop field descriptions come from the schema."
          : undefined,
      },
      supportedStyleProperties,
    };
  }

  if (resolvedCacheKey) {
    schemaCache.set(resolvedCacheKey, result);
  }

  return result;
}

export function clearSchemaJsonCache() {
  schemaCache.clear();
}
