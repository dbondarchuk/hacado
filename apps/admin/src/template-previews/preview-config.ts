import { BLOG_TEMPLATE_PREVIEWS } from "@hacado/app-store/template-preview-entries";
import type { TemplatePreviewEntry } from "@hacado/app-store/template-previews/types";
import { TEMPLATE_PREVIEWS } from "@hacado/page-builder/templates";

export const TEMPLATE_PREVIEW_MANIFEST: TemplatePreviewEntry[] = [
  ...TEMPLATE_PREVIEWS,
  ...BLOG_TEMPLATE_PREVIEWS,
];

const delayByKey = new Map(
  TEMPLATE_PREVIEW_MANIFEST.map((entry) => [entry.key, entry.delayMs ?? 3000]),
);

export function getTemplatePreviewDelayMs(key: string): number {
  return delayByKey.get(key) ?? 3000;
}
