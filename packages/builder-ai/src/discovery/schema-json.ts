import * as z from "zod";

const schemaCache = new Map<string, unknown>();

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

export function clearSchemaJsonCache() {
  schemaCache.clear();
}
