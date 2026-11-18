import type { Design } from "../designer/lib/types";

const SHAPE_ALIASES: Record<string, "rectangle" | "circle" | "line"> = {
  rectangle: "rectangle",
  rect: "rectangle",
  square: "rectangle",
  circle: "circle",
  oval: "circle",
  ellipse: "circle",
  line: "line",
};

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function inferAspectRatio(width: number, height: number): string {
  if (width <= 0 || height <= 0) return "custom";

  const ratio = width / height;
  const known = [
    { value: "3:2", ratio: 3 / 2 },
    { value: "4:3", ratio: 4 / 3 },
    { value: "1:1", ratio: 1 },
    { value: "16:9", ratio: 16 / 9 },
  ];

  for (const entry of known) {
    if (Math.abs(entry.ratio - ratio) < 0.02) return entry.value;
  }

  return "custom";
}

function normalizePaint(value: unknown): unknown {
  const paint = asObject(value);
  if (!paint) return undefined;

  const type = paint.type;
  if (
    type === "none" ||
    type === "color" ||
    type === "gradient" ||
    type === "image"
  ) {
    return paint;
  }

  if (typeof paint.color === "string") {
    return { type: "color", color: paint.color };
  }

  return undefined;
}

function normalizeBackground(value: unknown): unknown {
  const bg = asObject(value);
  if (!bg) return undefined;

  let type = bg.type;
  if (type === "solid" || type === "fill") type = "color";
  if (type === "none" || type === "transparent" || type === undefined) {
    return undefined;
  }

  if (type !== "color" && type !== "gradient" && type !== "image") {
    return undefined;
  }

  return { ...bg, type };
}

function normalizeElement(
  raw: unknown,
  index: number,
  canvas: { width: number; height: number },
): Record<string, unknown> | null {
  const el = asObject(raw);
  if (!el) return null;

  let type = typeof el.type === "string" ? el.type : null;
  if (!type) return null;

  if (
    type === "rect" ||
    type === "rectangle" ||
    type === "circle" ||
    type === "line" ||
    type === "square" ||
    type === "ellipse" ||
    type === "oval"
  ) {
    if (!el.shapeType) el.shapeType = type;
    type = "shape";
  }

  const id =
    typeof el.id === "string" && el.id.trim()
      ? el.id.trim()
      : `el-${type}-${index + 1}`;

  const positionObj = asObject(el.position);
  const sizeObj = asObject(el.size);

  const position = {
    x: asNumber(positionObj?.x ?? el.x, Math.round(canvas.width * 0.08)),
    y: asNumber(
      positionObj?.y ?? el.y,
      Math.round(canvas.height * 0.08 + index * 36),
    ),
  };

  const size = {
    width: asNumber(
      sizeObj?.width ?? el.width,
      type === "text" ? Math.round(canvas.width * 0.4) : 120,
    ),
    height: asNumber(sizeObj?.height ?? el.height, type === "text" ? 48 : 120),
  };

  const base = {
    id,
    type,
    position,
    size,
    rotation: asNumber(el.rotation, 0),
    opacity: asNumber(el.opacity, 1),
    locked: typeof el.locked === "boolean" ? el.locked : undefined,
    visible: typeof el.visible === "boolean" ? el.visible : true,
  };

  if (type === "text") {
    const styles = asObject(el.styles) ?? {};
    return {
      ...base,
      content: typeof el.content === "string" ? el.content : "",
      fieldKey: typeof el.fieldKey === "string" ? el.fieldKey : undefined,
      required: typeof el.required === "boolean" ? el.required : undefined,
      sampleValue:
        typeof el.sampleValue === "string" ? el.sampleValue : undefined,
      dateFormat: typeof el.dateFormat === "string" ? el.dateFormat : undefined,
      styles: {
        fontFamily:
          typeof styles.fontFamily === "string" ? styles.fontFamily : "Inter",
        fontSize: asNumber(styles.fontSize, 18),
        fontWeight: asNumber(styles.fontWeight, 500),
        lineHeight:
          typeof styles.lineHeight === "number" ? styles.lineHeight : undefined,
        color: typeof styles.color === "string" ? styles.color : "#111111",
        backgroundColor:
          typeof styles.backgroundColor === "string"
            ? styles.backgroundColor
            : undefined,
        textAlign:
          styles.textAlign === "left" ||
          styles.textAlign === "center" ||
          styles.textAlign === "right"
            ? styles.textAlign
            : "left",
      },
    };
  }

  if (type === "shape") {
    const rawShape =
      typeof el.shapeType === "string"
        ? el.shapeType.toLowerCase()
        : typeof el.shape === "string"
          ? el.shape.toLowerCase()
          : "rectangle";

    const shapeType = SHAPE_ALIASES[rawShape] ?? "rectangle";
    const styles = asObject(el.styles) ?? {};

    return {
      ...base,
      shapeType,
      styles: {
        fill: typeof styles.fill === "string" ? styles.fill : undefined,
        stroke: typeof styles.stroke === "string" ? styles.stroke : undefined,
        strokeWidth:
          typeof styles.strokeWidth === "number"
            ? styles.strokeWidth
            : undefined,
        borderRadius:
          typeof styles.borderRadius === "number"
            ? styles.borderRadius
            : undefined,
        fillPaint: normalizePaint(styles.fillPaint),
        strokePaint: normalizePaint(styles.strokePaint),
      },
    };
  }

  if (type === "image") {
    const styles = asObject(el.styles) ?? {};
    return {
      ...base,
      src: typeof el.src === "string" ? el.src : "",
      styles: {
        objectFit:
          styles.objectFit === "contain" ||
          styles.objectFit === "cover" ||
          styles.objectFit === "fill"
            ? styles.objectFit
            : "cover",
      },
    };
  }

  if (type === "icon") {
    const styles = asObject(el.styles) ?? {};
    return {
      ...base,
      icon: typeof el.icon === "string" && el.icon.trim() ? el.icon : "gift",
      styles: {
        color: typeof styles.color === "string" ? styles.color : "#111111",
        strokeWidth:
          typeof styles.strokeWidth === "number" ? styles.strokeWidth : 2,
      },
    };
  }

  if (type === "group") {
    const children = Array.isArray(el.children)
      ? el.children.filter((id): id is string => typeof id === "string")
      : [];

    if (children.length < 2) return null;

    return { ...base, children };
  }

  return null;
}

/**
 * Repair common model mistakes before zod validation:
 * missing geometry, alias shape names, invalid background types, missing aspectRatio.
 */
export function normalizeGiftCardDesignPayload(
  designRaw: unknown,
  fallbackCanvas?: Design["canvas"],
): unknown {
  const design = asObject(designRaw);
  if (!design) return designRaw;

  const canvasRaw = asObject(design.canvas) ?? {};
  const width = asNumber(
    canvasRaw.width,
    fallbackCanvas?.width && fallbackCanvas.width > 0
      ? fallbackCanvas.width
      : 1200,
  );

  const height = asNumber(
    canvasRaw.height,
    fallbackCanvas?.height && fallbackCanvas.height > 0
      ? fallbackCanvas.height
      : 800,
  );

  const aspectRatio =
    typeof canvasRaw.aspectRatio === "string" && canvasRaw.aspectRatio.trim()
      ? canvasRaw.aspectRatio
      : inferAspectRatio(width, height);

  const theme =
    canvasRaw.theme === "light" || canvasRaw.theme === "dark"
      ? canvasRaw.theme
      : fallbackCanvas?.theme;

  const canvas = {
    width,
    height,
    aspectRatio,
    theme,
    background: normalizeBackground(canvasRaw.background),
  };

  const elements = Array.isArray(design.elements)
    ? design.elements
        .map((el, index) => normalizeElement(el, index, canvas))
        .filter((el): el is Record<string, unknown> => Boolean(el))
    : [];

  return { canvas, elements };
}

export function canvasSizeChanged(
  before: Design["canvas"],
  after: Design["canvas"],
): boolean {
  return (
    before.width !== after.width ||
    before.height !== after.height ||
    before.aspectRatio !== after.aspectRatio
  );
}

export function instructionRequestsCanvasResize(instruction: string): boolean {
  return /\b(aspect\s*ratio|canvas\s*size|dimensions?|width|height|resize|landscape|portrait|square|16\s*:\s*9|3\s*:\s*2|4\s*:\s*3|1\s*:\s*1)\b/i.test(
    instruction,
  );
}

export function instructionDeclinesCanvasResize(instruction: string): boolean {
  return /\b(no|keep|retain|leave|don'?t|do not)\b[\s\S]{0,48}\b(canvas|aspect|size|dimension|width|height)\b/i.test(
    instruction,
  );
}

/** True when the user explicitly allows/requests a canvas size change (not "keep current"). */
export function instructionApprovesCanvasResize(instruction: string): boolean {
  const text = instruction.trim();
  if (!text || instructionDeclinesCanvasResize(text)) return false;

  return (
    /\b(yes|use|change|set|switch|make|approve|confirm|please)\b[\s\S]{0,80}\b(canvas|aspect|dimension|size|\d+\s*[x×]\s*\d+|1\s*:\s*1|3\s*:\s*2|4\s*:\s*3|16\s*:\s*9|square|landscape|portrait)\b/i.test(
      text,
    ) ||
    /\b(canvas|aspect\s*ratio|dimensions?)\b[\s\S]{0,40}\b(to|as)\b[\s\S]{0,24}(\d+\s*[x×]\s*\d+|1\s*:\s*1|3\s*:\s*2|4\s*:\s*3|16\s*:\s*9|square|landscape|portrait)\b/i.test(
      text,
    )
  );
}

export function withPreservedCanvasSize<T extends { canvas: Design["canvas"] }>(
  design: T,
  canvas: Design["canvas"],
): T {
  return {
    ...design,
    canvas: {
      ...design.canvas,
      width: canvas.width,
      height: canvas.height,
      aspectRatio: canvas.aspectRatio,
    },
  };
}
