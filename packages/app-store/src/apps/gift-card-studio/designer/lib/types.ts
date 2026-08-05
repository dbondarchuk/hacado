import type { IconName } from "@hacado/ui";
import { DateTime } from "luxon";

export type { IconName };

export type ElementType = "text" | "image" | "shape" | "icon" | "group";

export type FieldValue = string | DateTime | number;
export type FieldKey =
  | "amount"
  | "code"
  | "to"
  | "from"
  | "message"
  | "expiresAt";

export type FieldKeyValues = {
  amount: string;
  code: string;
  to?: string | null;
  from?: string | null;
  message?: string | null;
  expiresAt?: DateTime | null;
};

export const DYNAMIC_FIELDS: FieldKey[] = [
  "amount",
  "code",
  "to",
  "from",
  "message",
  "expiresAt",
] as const;

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface TextStyles {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  color?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right";
  fontSizeLocked?: boolean;
}

export type PaintType = "none" | "color" | "gradient" | "image";

export interface GradientPaint {
  type: "linear" | "radial";
  colors: string[];
  angle?: number;
}

export interface ImagePaint {
  src: string;
  fit?: "cover" | "contain" | "fill";
}

export interface Paint {
  type: PaintType;
  color?: string;
  gradient?: GradientPaint;
  image?: ImagePaint;
}

export interface ShapeStyles {
  // Legacy single-value fields (kept for compatibility)
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
  // Rich paint fields
  fillPaint?: Paint;
  strokePaint?: Paint;
}

export interface ImageStyles {
  objectFit?: "contain" | "cover" | "fill";
}

export interface IconStyles {
  color?: string;
  /** Stroke width in Lucide/viewBox units (24×24); default 2 */
  strokeWidth?: number;
}

export interface BaseElement {
  id: string;
  type: ElementType;
  position: Position;
  size: Size;
  rotation: number;
  opacity: number;
  locked?: boolean;
  visible?: boolean;
}

export interface TextElement extends BaseElement {
  type: "text";
  content: string;
  styles: TextStyles;
  fieldKey?: string;
  required?: boolean;
  /** Luxon format string for date display when fieldKey === "expiresAt" */
  dateFormat?: string;
}

export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  styles: ImageStyles;
}

export interface IconElement extends BaseElement {
  type: "icon";
  icon: string;
  styles: IconStyles;
}

export interface ShapeElement extends BaseElement {
  type: "shape";
  shapeType: "rectangle" | "circle" | "line";
  styles: ShapeStyles;
}

export interface GroupElement extends BaseElement {
  type: "group";
  children: string[]; // IDs of child elements
}

export type Element =
  | TextElement
  | ImageElement
  | IconElement
  | ShapeElement
  | GroupElement;

export interface CanvasBackground {
  type: "color" | "gradient" | "image";
  color?: string;
  gradient?: {
    type: "linear" | "radial";
    colors: string[];
    angle?: number;
  };
  image?: {
    src: string;
    fit?: "cover" | "contain" | "fill" | "none";
    position?: string;
  };
}

export interface Canvas {
  width: number;
  height: number;
  aspectRatio: string;
  theme?: "light" | "dark";
  background?: CanvasBackground;
}

export interface Design {
  canvas: Canvas;
  elements: Element[];
}

export const ASPECT_RATIOS = [
  { label: "3:2", value: "3:2", ratio: 3 / 2 },
  { label: "4:3", value: "4:3", ratio: 4 / 3 },
  { label: "1:1", value: "1:1", ratio: 1 },
  { label: "16:9", value: "16:9", ratio: 16 / 9 },
  { label: "Custom", value: "custom", ratio: null },
];

/** Luxon format strings for expiresAt. Pass to DateTime#toFormat(). Label = DateTime.now().toFormat(format). */
export const EXPIRES_AT_DATE_FORMATS = [
  "MMM d, yyyy",
  "MMMM d, yyyy",
  "M/d/yyyy",
  "MM/dd/yyyy",
  "dd/MM/yyyy",
  "dd.MM.yyyy",
  "yyyy-MM-dd",
] as const;

export const DEFAULT_EXPIRES_AT_DATE_FORMAT = EXPIRES_AT_DATE_FORMATS[0];

/** Get the date format string for expiresAt from design (for rendering/backend). */
export function getExpiresAtDateFormat(design: Design): string {
  const el = design.elements.find(
    (e): e is TextElement =>
      e.type === "text" && (e as TextElement).fieldKey === "expiresAt",
  );
  return el?.dateFormat ?? DEFAULT_EXPIRES_AT_DATE_FORMAT;
}
