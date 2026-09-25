"use client";

import {
  buildPreviewChromeArgs,
  parsePreviewHeaderParam,
  PreviewChrome,
  type PreviewHeaderVariant,
} from "@/components/install/preview-chrome";
import {
  getTemplatePreviewArgs,
  getTemplatePreviewBlockRegistry,
  resolveTemplatePreviewBlocks,
} from "@/template-previews/registry";
import { generateId } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { ReplaceOriginalColors } from "@hacado/page-builder-base/reader";
import { PageReader, Styling } from "@hacado/page-builder/reader";
import {
  getPackSuggestedStyling,
  getWebsitePack,
  layoutPreviewHeaderVariant,
  packIdFromLayoutTemplateKey,
  type PageLayoutKind,
} from "@hacado/page-builder/templates";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

type Props = {
  templateKey: string;
  previewDelayMs: number;
  /** When true, wrap with install header + footer chrome. */
  fullPage?: boolean;
};

const LAYOUT_KIND_RE = /_(home|booking|service|about|terms)$/;

function layoutKindFromTemplateKey(templateKey: string): PageLayoutKind | null {
  const match = LAYOUT_KIND_RE.exec(templateKey);
  return (match?.[1] as PageLayoutKind | undefined) ?? null;
}

function fullPageHeaderVariant(templateKey: string): PreviewHeaderVariant {
  const packId = packIdFromLayoutTemplateKey(templateKey);
  const layoutKind = layoutKindFromTemplateKey(templateKey);
  if (!packId || !layoutKind) return "solid";
  return layoutPreviewHeaderVariant(packId, layoutKind);
}

export function TemplatePreviewClient({
  templateKey,
  previewDelayMs,
  fullPage = false,
}: Props) {
  const t = useI18n();
  const searchParams = useSearchParams();
  const queryHeader = parsePreviewHeaderParam(searchParams.get("header"));
  const queryFooter = searchParams.get("footer") === "1";

  const packId = useMemo(
    () => packIdFromLayoutTemplateKey(templateKey),
    [templateKey],
  );

  const packStyling = useMemo(
    () => (packId ? getPackSuggestedStyling(packId) : undefined),
    [packId],
  );

  const businessName = useMemo(() => {
    if (!packId) return "Studio";
    return t(getWebsitePack(packId).displayName);
  }, [packId, t]);

  const chromeArgs = useMemo(
    () => buildPreviewChromeArgs({ businessName }),
    [businessName],
  );

  const header = useMemo(() => {
    if (fullPage) return fullPageHeaderVariant(templateKey);
    return queryHeader;
  }, [fullPage, templateKey, queryHeader]);

  const showFooter = fullPage || queryFooter;
  const showChrome = Boolean(header) || showFooter;

  const document = useMemo(() => {
    const children = resolveTemplatePreviewBlocks(templateKey, t);
    if (!children?.length) return null;

    return {
      id: generateId(),
      type: "PageLayout" as const,
      data: {
        fontFamily: "PRIMARY" as const,
        fullWidth: true,
        children,
      },
    };
  }, [templateKey, t]);

  const previewArgs = useMemo(
    () => ({
      ...chromeArgs,
      ...getTemplatePreviewArgs(templateKey),
    }),
    [chromeArgs, templateKey],
  );

  const blockRegistry = useMemo(
    () => getTemplatePreviewBlockRegistry(templateKey),
    [templateKey],
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.removeAttribute("data-preview-ready");

    if (!document) {
      root.setAttribute("data-preview-ready", "true");
      return;
    }

    const markReady = () => {
      root.setAttribute("data-preview-ready", "true");
    };

    const scheduleReady = () => {
      window.setTimeout(markReady, previewDelayMs);
    };

    const fontsReady = window.document.fonts?.ready;
    if (fontsReady) {
      void fontsReady.then(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(scheduleReady);
        });
      });
      return;
    }

    const timeout = window.setTimeout(markReady, previewDelayMs);
    return () => window.clearTimeout(timeout);
  }, [document, previewDelayMs]);

  if (!document) {
    return (
      <div data-template-preview data-preview-error>
        Unknown template: {templateKey}
      </div>
    );
  }

  const page = (
    <PageReader
      document={document}
      args={previewArgs}
      blockRegistry={blockRegistry}
      isEditor
    />
  );

  return (
    <div data-template-preview className="min-h-screen bg-background">
      <Styling styling={packStyling} />
      <ReplaceOriginalColors />
      {showChrome ? (
        <PreviewChrome
          header={header}
          footer={showFooter}
          businessName={businessName}
          args={chromeArgs}
        >
          {page}
        </PreviewChrome>
      ) : (
        page
      )}
    </div>
  );
}
