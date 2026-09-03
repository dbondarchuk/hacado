import type { TEditorBlock } from "@hacado/builder";
import type { I18nFn, Language } from "@hacado/i18n";

export const TEMPLATE_PREVIEW_BASE = "/pages/templates";

export type TemplatePreviewEntry = {
  key: string;
  group: string;
  file: string;
  delayMs?: number;
};

export type TemplatePreviewProvider = {
  sourceId: string;
  entries: readonly TemplatePreviewEntry[];
  resolveBlock: (
    key: string,
    t: I18nFn<undefined, undefined>,
  ) => TEditorBlock | null;
  /** Multi-block layout templates (optional). */
  resolveBlocks?: (
    key: string,
    t: I18nFn<undefined, undefined>,
  ) => TEditorBlock[] | null;
  getPreviewArgs?: () => Record<string, unknown>;
  getBlockRegistry?: () => Record<string, unknown>;
  getTranslations?: (language: Language) => Promise<Record<string, any>>;
};

export function templatePreviewPath(group: string, file: string): string {
  return `${TEMPLATE_PREVIEW_BASE}/${group}/${file}`;
}

export function getPreviewDelayMs(
  providers: readonly TemplatePreviewProvider[],
  key: string,
): number {
  for (const provider of providers) {
    const entry = provider.entries.find((item) => item.key === key);
    if (entry) {
      return entry.delayMs ?? 3000;
    }
  }
  return 3000;
}

export function findPreviewProvider(
  providers: readonly TemplatePreviewProvider[],
  key: string,
): TemplatePreviewProvider | null {
  for (const provider of providers) {
    if (provider.entries.some((item) => item.key === key)) {
      return provider;
    }
  }
  return null;
}

export function flattenPreviewEntries(
  providers: readonly TemplatePreviewProvider[],
): TemplatePreviewEntry[] {
  return providers.flatMap((provider) => [...provider.entries]);
}
