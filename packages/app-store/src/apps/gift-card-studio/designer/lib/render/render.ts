import { DateTime } from "luxon";
import satori from "satori";
import { getFamilyFromStoredFont, SERVER_FONT_WEIGHTS } from "../fonts";
import type {
  CanvasBackground,
  Design,
  Element,
  FieldKey,
  GroupElement,
  IconElement,
  ImageElement,
  Paint,
  ShapeElement,
  TextElement,
} from "../types";
import { DEFAULT_EXPIRES_AT_DATE_FORMAT, FieldKeyValues } from "../types";
import { loadGoogleFontForSatori } from "./font";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RenderRequest {
  design: Design;
  /** Dynamic field values keyed by fieldKey (e.g. { amount: "$50", to: "Jane" }) */
  fields?: FieldKeyValues;
  format?: "pdf" | "png";
}

// ---------------------------------------------------------------------------
// Paint → CSS helpers (server-side, no DOM)
// ---------------------------------------------------------------------------

function paintToCss(paint: Paint | undefined, fallback: string): string {
  if (!paint || paint.type === "none") return fallback;
  if (paint.type === "color") return paint.color ?? fallback;

  if (paint.type === "gradient" && paint.gradient) {
    const { type, colors, angle } = paint.gradient;
    return type === "linear"
      ? `linear-gradient(${angle ?? 0}deg, ${colors.join(", ")})`
      : `radial-gradient(circle, ${colors.join(", ")})`;
  }

  if (paint.type === "image" && paint.image?.src)
    return `url(${paint.image.src})`;

  return fallback;
}

function backgroundToCss(
  bg: CanvasBackground | undefined,
): React.CSSProperties {
  if (!bg) return { backgroundColor: "transparent" };
  if (bg.type === "color")
    return { backgroundColor: bg.color ?? "transparent" };

  if (bg.type === "gradient" && bg.gradient) {
    const { type, colors, angle } = bg.gradient;
    const grad =
      type === "linear"
        ? `linear-gradient(${angle ?? 0}deg, ${colors.join(", ")})`
        : `radial-gradient(circle, ${colors.join(", ")})`;

    return { background: grad } as React.CSSProperties;
  }

  if (bg.type === "image" && bg.image?.src) {
    return {
      backgroundImage: `url(${bg.image.src})`,
      backgroundSize: bg.image.fit ?? "cover",
      backgroundPosition: bg.image.position ?? "center",
      backgroundRepeat: "no-repeat",
    } as React.CSSProperties;
  }

  return { backgroundColor: "transparent" };
}

// ---------------------------------------------------------------------------
// Element → satori React-compatible object tree
// ---------------------------------------------------------------------------

function resolveText(el: TextElement, fields: FieldKeyValues): string {
  if (el.fieldKey) {
    if (!!fields[el.fieldKey as FieldKey]) {
      const value = fields[el.fieldKey as FieldKey]!;
      if (el.fieldKey === "expiresAt") {
        return (value as DateTime).toFormat(
          el.dateFormat ?? DEFAULT_EXPIRES_AT_DATE_FORMAT,
        );
      }

      return value.toString();
    } else {
      return "";
    }
  }

  // if (el.fieldKey && el.sampleValue) return el.sampleValue;
  return el.content ?? "";
}

function renderTextNode(el: TextElement, fields: FieldKeyValues): object {
  const text = resolveText(el, fields);
  const align = el.styles.textAlign ?? "left";
  const justifyMap: Record<string, string> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  };

  const fontFamily =
    getFamilyFromStoredFont(el.styles.fontFamily) ??
    el.styles.fontFamily ??
    "sans-serif";

  return {
    type: "div",
    props: {
      style: {
        position: "absolute" as const,
        left: el.position.x,
        top: el.position.y,
        width: el.size.width,
        height: el.size.height,
        transform: `rotate(${el.rotation ?? 0}deg)`,
        opacity: el.opacity,
        display: "flex",
        alignItems: "center",
        justifyContent: justifyMap[align] ?? "flex-start",
        fontFamily,
        fontSize: el.styles.fontSize ?? 16,
        fontWeight: el.styles.fontWeight ?? 400,
        lineHeight: el.styles.lineHeight ?? 1.5,
        color: el.styles.color ?? "#000000",
        backgroundColor: el.styles.backgroundColor ?? "transparent",
        whiteSpace: "pre-wrap",
        overflow: "hidden",
      },
      children: text,
    },
  };
}

function removeSvgComments(svg: string): string {
  return svg.replace(/<!--[\s\S]*?-->/g, "");
}

async function renderImageNode(el: ImageElement): Promise<object | null> {
  if (!el.src) return null;

  let src = el.src;
  if (el.src.endsWith(".svg")) {
    try {
      const svg = await fetch(el.src).then((res) => res.text());
      const data = removeSvgComments(svg);
      const base64 = Buffer.from(data).toString("base64");
      src = `data:image/svg+xml;base64,${base64}`;
    } catch (error) {
      console.error(`Error optimizing SVG: ${error}`);
      return null;
    }
  }

  return {
    type: "img",
    props: {
      src,
      style: {
        position: "absolute" as const,
        left: el.position.x,
        top: el.position.y,
        width: el.size.width,
        height: el.size.height,
        transform: `rotate(${el.rotation ?? 0}deg)`,
        opacity: el.opacity,
        objectFit: el.styles.objectFit ?? "contain",
      },
    },
  };
}

let lucideReactPromise: Promise<typeof import("lucide-react")> | null = null;

function loadLucideReact(): Promise<typeof import("lucide-react")> {
  lucideReactPromise ??= import("lucide-react");
  return lucideReactPromise;
}

/** Design icon ids are kebab-case; `lucide-react` named exports are PascalCase. */
function iconIdToLucideExportKey(iconId: string): string {
  return iconId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

async function renderIconNode(el: IconElement): Promise<object> {
  const lucide = await loadLucideReact();
  const w = el.size.width;
  const h = el.size.height;
  const color = el.styles?.color ?? "#000000";
  const strokeWU = el.styles?.strokeWidth ?? 2;
  const iconName = iconIdToLucideExportKey(el.icon);
  const icon = (lucide as Record<string, unknown>)[iconName];

  const wrapperStyle = {
    position: "absolute" as const,
    display: "flex",
    left: el.position.x,
    top: el.position.y,
    width: w,
    height: h,
    transform: `rotate(${el.rotation ?? 0}deg)`,
    opacity: el.opacity,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  const isComponentLike =
    typeof icon === "function" ||
    (typeof icon === "object" && icon !== null && "$$typeof" in icon);

  if (!isComponentLike) {
    return {
      type: "div",
      props: {
        style: {
          ...wrapperStyle,
          backgroundColor: "#e5e5e5",
          fontSize: Math.min(w, h) * 0.15,
          color: "#737373",
        },
        children: "?",
      },
    };
  }

  return {
    type: "div",
    props: {
      style: wrapperStyle,
      children: {
        type: icon,
        props: {
          width: w,
          height: h,
          color,
          strokeWidth: strokeWU * (Math.min(w, h) / 24),
        },
      },
    },
  };
}

function renderShapeNode(el: ShapeElement): object {
  const { shapeType, styles } = el;
  const fillPaint =
    styles.fillPaint ??
    (styles.fill ? { type: "color" as const, color: styles.fill } : undefined);

  const strokePaint =
    styles.strokePaint ??
    (styles.stroke
      ? { type: "color" as const, color: styles.stroke }
      : undefined);

  const fillCss = paintToCss(fillPaint, "transparent");
  const strokeColor =
    strokePaint?.type === "color"
      ? (strokePaint.color ?? undefined)
      : undefined;

  const strokeWidth = styles.strokeWidth ?? 1;

  if (shapeType === "line") {
    return {
      type: "div",
      props: {
        style: {
          position: "absolute" as const,
          display: "flex",
          left: el.position.x,
          top: el.position.y,
          width: el.size.width,
          height: strokeWidth,
          transform: `rotate(${el.rotation ?? 0}deg)`,
          opacity: el.opacity,
          backgroundColor:
            fillCss !== "transparent" ? fillCss : (strokeColor ?? "#000000"),
        },
      },
    };
  }

  const isGradOrImg =
    fillPaint?.type === "gradient" || fillPaint?.type === "image";

  const shapeStyle: Record<string, unknown> = {
    position: "absolute" as const,
    display: "flex",
    left: el.position.x,
    top: el.position.y,
    width: el.size.width,
    height: el.size.height,
    transform: `rotate(${el.rotation ?? 0}deg)`,
    opacity: el.opacity,
    border: strokeColor ? `${strokeWidth}px solid ${strokeColor}` : "none",
    borderRadius: shapeType === "circle" ? "50%" : (styles.borderRadius ?? 0),
  };

  if (isGradOrImg) {
    shapeStyle.background = fillCss;
  } else {
    shapeStyle.backgroundColor = fillCss;
  }

  return { type: "div", props: { style: shapeStyle } };
}

async function renderGroupNode(
  group: GroupElement,
  allElements: Element[],
  fields: FieldKeyValues,
): Promise<object> {
  const children = group.children
    .map((id) => allElements.find((e) => e.id === id))
    .filter(Boolean) as Element[];

  const rendered = await Promise.all(
    children.map((child) => renderElement(child, allElements, fields)),
  );

  return {
    type: "div",
    props: {
      style: {
        position: "absolute" as const,
        display: "flex",
        left: group.position.x,
        top: group.position.y,
        width: group.size.width,
        height: group.size.height,
        transform: `rotate(${group.rotation ?? 0}deg)`,
        opacity: group.opacity,
      },
      children: rendered.filter(Boolean),
    },
  };
}

async function renderElement(
  el: Element,
  allElements: Element[],
  fields: FieldKeyValues,
): Promise<object | null> {
  if (el.visible === false) return null;
  // When inside a group, positions are already relative to group origin
  // so we create a wrapper only for the offset when not at root
  if (el.type === "text") return renderTextNode(el as TextElement, fields);
  if (el.type === "image") return renderImageNode(el as ImageElement);
  if (el.type === "icon") return renderIconNode(el as IconElement);
  if (el.type === "shape") return renderShapeNode(el as ShapeElement);
  if (el.type === "group")
    return renderGroupNode(el as GroupElement, allElements, fields);

  return null;
}

// ---------------------------------------------------------------------------
// Build the root satori element tree
// ---------------------------------------------------------------------------

async function buildElementTree(
  design: Design,
  fields: FieldKeyValues,
): Promise<object> {
  const { canvas, elements } = design;

  // Top-level elements (skip children that are part of a group)
  const groupChildIds = new Set<string>();
  elements.forEach((el) => {
    if (el.type === "group") {
      (el as GroupElement).children.forEach((id) => groupChildIds.add(id));
    }
  });

  const topLevel = elements.filter((el) => !groupChildIds.has(el.id));

  const bgStyle = backgroundToCss(canvas.background);

  const rendered = await Promise.all(
    topLevel.map((el) => renderElement(el, elements, fields)),
  );

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        position: "relative" as const,
        width: canvas.width,
        height: canvas.height,
        overflow: "hidden",
        ...bgStyle,
      },
      children: rendered.filter(Boolean),
    },
  };
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

/** Collect unique font family names from text elements in the design. */
function collectFontFamilies(design: Design): Set<string> {
  const families = new Set<string>();
  for (const el of design.elements) {
    if (el.type === "text") {
      const family = getFamilyFromStoredFont(
        (el as TextElement).styles.fontFamily,
      );

      if (family) families.add(family);
    }
  }

  return families;
}

export async function png2pdf(
  design: Design,
  pngBuffer: Buffer,
): Promise<Buffer> {
  const pdfkit = await import("pdfkit");
  const PDFDocument = pdfkit.default;
  const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    // Convert pixels → points (1 pt = 1/72 inch, 96 px/inch → factor = 72/96 = 0.75)
    const PX_TO_PT = 72 / 96;
    const pageWidth = design.canvas.width * PX_TO_PT;
    const pageHeight = design.canvas.height * PX_TO_PT;

    const doc = new PDFDocument({
      size: [pageWidth, pageHeight],
      margin: 0,
      autoFirstPage: true,
    });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Place the PNG covering the full page
    doc.image(pngBuffer, 0, 0, { width: pageWidth, height: pageHeight });

    doc.end();
  });

  return pdfBuffer;
}

export async function renderGiftCard({
  design,
  fields,
  format = "pdf",
}: RenderRequest): Promise<Buffer> {
  // 1. Build satori element tree
  const tree = await buildElementTree(
    design,
    fields ?? {
      amount: "0.00",
      code: "PREVIEW",
    },
  );

  // 2. Load fonts used in the design (or fallback to Roboto if none)
  const fontFamilies = collectFontFamilies(design);
  const toLoad = fontFamilies.size > 0 ? Array.from(fontFamilies) : ["Roboto"];

  const fontPromises = toLoad.map((family) =>
    loadGoogleFontForSatori(family, SERVER_FONT_WEIGHTS),
  );

  const fontArrays = await Promise.all(fontPromises);
  const fonts = fontArrays.flat();

  // 3. Render SVG via satori
  let svg: string;
  try {
    svg = await satori(tree as any, {
      width: design.canvas.width,
      height: design.canvas.height,
      fonts: fonts as any,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`SVG render failed: ${msg}`);
  }

  // 3. Rasterise SVG → PNG using resvg
  let pngBuffer: Buffer;
  try {
    const { Resvg } = await import("@resvg/resvg-js");
    const resvg = new Resvg(svg, {
      fitTo: { mode: "original" },
    });

    const rendered = resvg.render();
    pngBuffer = Buffer.from(rendered.asPng());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`PNG render failed: ${msg}`);
  }

  if (format === "png") {
    return pngBuffer;
  }

  // 4. Embed PNG into a PDF using pdfkit
  return png2pdf(design, pngBuffer);
}
