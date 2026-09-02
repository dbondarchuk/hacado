"use client";

import {
  AppsTemplatePreviewProviders,
  findPreviewProvider,
  type TemplatePreviewProvider,
} from "@hacado/app-store/template-previews";
import type { TEditorBlock } from "@hacado/builder";
import type { I18nFn } from "@hacado/i18n";
import type { BlockProviderRegistry } from "@hacado/page-builder";
import {
  pageBuilderEditorTemplates,
  TEMPLATE_PREVIEWS,
} from "@hacado/page-builder/templates";

const pageBuilderPreviewProvider: TemplatePreviewProvider = {
  sourceId: "page-builder",
  entries: TEMPLATE_PREVIEWS,
  resolveBlock: (key: string, t: I18nFn<undefined, undefined>) => {
    const template =
      pageBuilderEditorTemplates[
        key as keyof typeof pageBuilderEditorTemplates
      ];
    if (!template) return null;
    return template.getBlock(t);
  },
};

const allProviders: TemplatePreviewProvider[] = [
  pageBuilderPreviewProvider,
  ...Object.values(AppsTemplatePreviewProviders),
];

export function resolveTemplatePreviewProvider(
  key: string,
): TemplatePreviewProvider | null {
  return findPreviewProvider(allProviders, key);
}

export function resolveTemplatePreviewBlock(
  key: string,
  t: I18nFn<undefined, undefined>,
): TEditorBlock | null {
  return resolveTemplatePreviewProvider(key)?.resolveBlock(key, t) ?? null;
}

export function getTemplatePreviewArgs(key: string): Record<string, unknown> {
  return resolveTemplatePreviewProvider(key)?.getPreviewArgs?.() ?? {};
}

export function getTemplatePreviewBlockRegistry(
  key: string,
): BlockProviderRegistry | undefined {
  const registry = resolveTemplatePreviewProvider(key)?.getBlockRegistry?.();
  return registry as BlockProviderRegistry | undefined;
}
