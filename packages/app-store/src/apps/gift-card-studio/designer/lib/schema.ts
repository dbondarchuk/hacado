import { z } from "zod";

// ── Paint (fill / stroke) ─────────────────────────────────────────────────────

const gradientPaintSchema = z.object({
  type: z.enum(["linear", "radial"]),
  colors: z.array(z.string()).min(2, "Gradient requires at least 2 colors"),
  angle: z.number().optional(),
});

const imagePaintSchema = z.object({
  src: z.string().min(1, "Image source is required"),
  fit: z.enum(["cover", "contain", "fill"]).optional(),
});

const paintSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }),
  z.object({ type: z.literal("color"), color: z.string() }),
  z.object({ type: z.literal("gradient"), gradient: gradientPaintSchema }),
  z.object({ type: z.literal("image"), image: imagePaintSchema }),
]);

// ── Shared geometry ───────────────────────────────────────────────────────────

const positionSchema = z.object({ x: z.number(), y: z.number() });
const sizeSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
});

const baseElementSchema = z.object({
  id: z.string().min(1),
  position: positionSchema,
  size: sizeSchema,
  rotation: z.number().default(0),
  opacity: z.number().min(0).max(1).default(1),
  locked: z.boolean().optional(),
  visible: z.boolean().optional(),
});

// ── Element types ─────────────────────────────────────────────────────────────

const textStylesSchema = z.object({
  fontFamily: z.string().optional(),
  fontSize: z.number().positive().optional(),
  fontWeight: z.number().optional(),
  lineHeight: z.number().optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  fontSizeLocked: z.boolean().optional(),
});

export const textElementSchema = baseElementSchema.extend({
  type: z.literal("text"),
  content: z.string(),
  styles: textStylesSchema,
  fieldKey: z.string().optional(),
  required: z.boolean().optional(),
  sampleValue: z.string().optional(),
  dateFormat: z.string().optional(),
});

const shapeStylesSchema = z.object({
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().nonnegative().optional(),
  borderRadius: z.number().nonnegative().optional(),
  fillPaint: paintSchema.optional(),
  strokePaint: paintSchema.optional(),
});

export const shapeElementSchema = baseElementSchema.extend({
  type: z.literal("shape"),
  shapeType: z.enum(["rectangle", "circle", "line"]),
  styles: shapeStylesSchema,
});

const imageStylesSchema = z.object({
  objectFit: z.enum(["contain", "cover", "fill"]).optional(),
});

export const imageElementSchema = baseElementSchema.extend({
  type: z.literal("image"),
  src: z.string(),
  styles: imageStylesSchema,
});

// export const iconsEnum = z.enum(iconNames);
const iconsEnum = z.string().min(1, "Icon is required");
const iconStylesSchema = z.object({
  color: z.string().optional(),
  strokeWidth: z.number().nonnegative().optional(),
});

export const iconElementSchema = baseElementSchema.extend({
  type: z.literal("icon"),
  icon: iconsEnum,
  styles: iconStylesSchema,
});

// Groups are defined lazily to support potential nesting in schema checks
export const groupElementSchema = baseElementSchema.extend({
  type: z.literal("group"),
  children: z
    .array(z.string())
    .min(2, "A group must contain at least 2 elements"),
});

export const elementSchema = z.discriminatedUnion("type", [
  textElementSchema,
  shapeElementSchema,
  imageElementSchema,
  iconElementSchema,
  groupElementSchema,
]);

// ── Canvas background ─────────────────────────────────────────────────────────

const canvasBackgroundSchema = z
  .object({
    type: z.enum(["color", "gradient", "image"]),
    color: z.string().optional(),
    gradient: z
      .object({
        type: z.enum(["linear", "radial"]),
        colors: z.array(z.string()).min(2),
        angle: z.number().optional(),
      })
      .optional(),
    image: z
      .object({
        src: z.string().min(1),
        fit: z.enum(["cover", "contain", "fill", "none"]).optional(),
        position: z.string().optional(),
      })
      .optional(),
  })
  .optional();

const canvasSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  aspectRatio: z.string(),
  theme: z.enum(["light", "dark"]).optional(),
  background: canvasBackgroundSchema,
});

// ── Design (top-level) ────────────────────────────────────────────────────────

const REQUIRED_FIELD_KEYS = ["amount", "code"] as const;

const designSchemaBase = z.object({
  canvas: canvasSchema,
  elements: z.array(elementSchema),
});

export const designSchema = designSchemaBase.superRefine((data, ctx) => {
  const fieldKeys = data.elements
    .filter((el): el is z.infer<typeof textElementSchema> => el.type === "text")
    .map((el) => el.fieldKey)
    .filter((key): key is string => Boolean(key));

  for (const key of REQUIRED_FIELD_KEYS) {
    if (!fieldKeys.includes(key)) {
      const label = key === "amount" ? "Gift Card Amount" : "Gift Card Code";
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["elements"],
        message: `Missing required field: ${label} (${key})`,
      });
    }
  }
});

// ── Gift-card specific validation ─────────────────────────────────────────────

export function validateGiftCardDesign(design: unknown): {
  success: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Structural + required-fields parse (same rules as designSchema superRefine)
  const result = designSchema.safeParse(design);
  if (!result.success) {
    result.error.issues.forEach((issue) => {
      errors.push(
        issue.path.length > 0
          ? `${issue.path.join(".")}: ${issue.message}`
          : issue.message,
      );
    });

    return { success: false, errors, warnings };
  }

  const { elements, canvas } = result.data;

  // Warn about empty canvases
  if (elements.filter((el) => el.type !== "group").length === 0) {
    warnings.push("Canvas has no visible elements");
  }

  // Warn about elements outside canvas bounds
  const { width, height } = canvas;
  elements.forEach((el) => {
    if (el.type !== "group") {
      const outsideX =
        el.position.x + el.size.width < 0 || el.position.x > width;

      const outsideY =
        el.position.y + el.size.height < 0 || el.position.y > height;

      if (outsideX || outsideY) {
        warnings.push(`Element "${el.id}" is fully outside the canvas bounds`);
      }
    }
  });

  return { success: true, errors, warnings };
}

export type DesignValue = z.infer<typeof designSchema>;
export type ElementValue = z.infer<typeof elementSchema>;
export type TextElementValue = z.infer<typeof textElementSchema>;
export type ShapeElementValue = z.infer<typeof shapeElementSchema>;
export type ImageElementValue = z.infer<typeof imageElementSchema>;
export type IconElementValue = z.infer<typeof iconElementSchema>;
export type GroupElementValue = z.infer<typeof groupElementSchema>;
export type PaintValue = z.infer<typeof paintSchema>;
