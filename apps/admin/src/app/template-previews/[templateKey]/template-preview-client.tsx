"use client";

import {
  parsePreviewHeaderParam,
  PreviewChrome,
} from "@/components/install/preview-chrome";
import {
  getTemplatePreviewArgs,
  getTemplatePreviewBlockRegistry,
  resolveTemplatePreviewBlocks,
} from "@/template-previews/registry";
import { generateId } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { PageReader, Styling } from "@hacado/page-builder/reader";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

type Props = {
  templateKey: string;
  previewDelayMs: number;
};

export function TemplatePreviewClient({ templateKey, previewDelayMs }: Props) {
  const t = useI18n();
  const searchParams = useSearchParams();
  const header = parsePreviewHeaderParam(searchParams.get("header"));
  const footer = searchParams.get("footer") === "1";

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
    () => getTemplatePreviewArgs(templateKey),
    [templateKey],
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
      <Styling />
      {header || footer ? (
        <PreviewChrome header={header} footer={footer}>
          {page}
        </PreviewChrome>
      ) : (
        page
      )}
    </div>
  );
}
