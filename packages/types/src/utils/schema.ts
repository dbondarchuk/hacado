import { z, ZodTypeAny } from "zod";

export const zEmail = z
  .email("validation.common.email.invalid")
  .max(256, "validation.common.email.max");
export const zPhone = z
  .string("validation.common.phone.required")
  .min(1, "validation.common.phone.required")
  .max(32, "validation.common.phone.max")
  .refine((s) => !s?.includes("_"), "validation.common.phone.invalid");

export const zAssetName = z.union(
  [
    z
      .string()
      .min(3, "validation.common.asset.minLength")
      .max(1024, "validation.common.asset.maxLength"),
    z
      .url("validation.common.asset.invalid")
      .max(2048, "validation.common.url.max"),
  ],
  { message: "validation.common.asset.invalid" },
);

export const zUrl = z
  .url("validation.common.url.invalid")
  .max(2048, "validation.common.url.max");

export type ErrorMessageWithParams = {
  message: string;
  params?: Record<string, any>;
};
export type ErrorMessage = string | ErrorMessageWithParams;
export const zErrorMessageWithParams = (
  message: string,
  params?: Record<string, any>,
) => JSON.stringify({ message, params });

export function zUniqueArray<ArrSchema extends z.ZodArray, UniqueVal>(
  schema: ArrSchema,
  uniqueBy: (item: z.infer<ArrSchema>[number]) => UniqueVal,
  errorMessage?: string,
) {
  return schema.superRefine((items, ctx) => {
    const seen = new Set<UniqueVal>();
    for (let index = 0; index < items.length; index++) {
      const item = items[index];

      const val = uniqueBy(item);
      if (seen.has(val)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: errorMessage || `Unique property validation failed`,
          path: [index],
        });
      } else {
        seen.add(val);
      }
    }
  }) as unknown as ArrSchema;
}

export function isPlainObject(
  value: unknown,
): value is Record<string | number | symbol, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

export function zStrictRecord<
  K extends z.ZodType<string | number | symbol, string | number | symbol>,
  V extends z.ZodType<any, any>,
>(zKey: K, zValue: V) {
  return z.custom<Record<z.infer<K>, z.infer<V>>>((input: unknown) => {
    return (
      isPlainObject(input) &&
      Object.entries(input).every(
        ([key, value]) =>
          zKey.safeParse(key).success && zValue.safeParse(value).success,
      )
    );
  }, "zodStrictRecord: error");
}

export function zOptionalOrMinLengthString(
  minLength: number,
  minLengthErrorMessage?: string,
) {
  return z
    .union([
      z
        .string(minLengthErrorMessage)
        .min(minLength, { message: minLengthErrorMessage }),
      z.string().length(0),
    ])
    .transform((e) => (e === "" ? undefined : e))
    .optional();
}

export function zMinMaxLengthString(
  min: { length: number; message?: string },
  max: { length: number; message?: string },
) {
  return z
    .string(min.message)
    .min(min.length, min.message)
    .max(max.length, max.message);
}

export function zOptionalOrMinMaxLengthString(
  min: { length: number; message?: string },
  max: { length: number; message?: string },
) {
  return asOptionalField(zMinMaxLengthString(min, max));
}

export function zOptionalOrMaxLengthString(
  maxLength: number,
  maxLengthErrorMessage?: string,
) {
  return z
    .union([
      z
        .string("validation.common.string.invalid")
        .max(maxLength, maxLengthErrorMessage),
      z.string().length(0),
    ])
    .transform((e) => (e === "" ? undefined : e))
    .optional();
}

export function zPossiblyOptionalMinMaxLengthString(
  required: boolean | undefined,
  min: { length: number; message?: string },
  max: { length: number; message?: string },
) {
  const zString = zMinMaxLengthString(min, max);
  return required ? zString : asOptionalField(zString);
}

export const zNonEmptyString = (
  message?: string,
  minLength: number = 1,
  maxLength?: number,
  maxLengthErrorMessage?: string,
) => {
  let zString = z
    .string(message)
    .min(
      minLength,
      message ?? `String must be at least ${minLength} characters long`,
    );

  if (maxLength) {
    zString = zString.max(
      maxLength,
      maxLengthErrorMessage ??
        `String must be at most ${maxLength} characters long`,
    );
  }
  return zString;
};

const emptyStringToUndefined = z.literal("").transform(() => undefined);

export function asOptionalField<T extends z.ZodType>(schema: T) {
  return schema.optional().or(emptyStringToUndefined);
}

export function asOptinalNumberField<T extends z.ZodNumber>(schema: T) {
  return z.preprocess(
    (arg) => (arg === "" || arg === null ? undefined : arg),
    schema.optional(),
  ) as unknown as z.ZodOptional<T>;
}

export function isValidObjectId(value: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

export const zObjectId = (message?: string) =>
  z
    .string(message ?? "validation.common.objectId.required")
    .refine(
      (s) => isValidObjectId(s),
      message ?? "validation.common.objectId.invalid",
    );

/**
 * Builds a union schema for `data & { type }` from a list of { type, data } objects.
 * Each variant is validated as { type: literal, ...data }.
 */
export function zTaggedUnion<
  const T extends string,
  const Items extends readonly { type: T; data?: ZodTypeAny }[],
>(items: Items) {
  const options = items.map(({ type, data }) =>
    data
      ? z.object({ type: z.literal(type) }).and(data)
      : z.object({ type: z.literal(type) }),
  );

  return z.union(
    options as unknown as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]],
  ) as z.ZodType<
    {
      [i in keyof Items]: { type: Items[i]["type"] } & z.infer<
        Items[i]["data"]
      >;
    }[number]
  >;
}
