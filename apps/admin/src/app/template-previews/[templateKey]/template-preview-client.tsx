"use client";

import {
  getTemplatePreviewArgs,
  getTemplatePreviewBlockRegistry,
  resolveTemplatePreviewBlock,
} from "@/template-previews/registry";
import { generateId } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { PageReader, Styling } from "@hacado/page-builder/reader";
import { useEffect, useMemo } from "react";

type Props = {
  templateKey: string;
  previewDelayMs: number;
};

export function TemplatePreviewClient({ templateKey, previewDelayMs }: Props) {
  const t = useI18n();

  const document = useMemo(() => {
    const block = resolveTemplatePreviewBlock(templateKey, t);
    if (!block) return null;

    return {
      id: generateId(),
      type: "PageLayout" as const,
      data: {
        fontFamily: "PRIMARY" as const,
        fullWidth: true,
        children: [block],
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

  return (
    <>
      <Styling />
      <div
        data-template-preview
        className="bg-background text-foreground"
        style={{ width: 1280, minHeight: 360 }}
      >
        <PageReader
          document={document}
          args={previewArgs}
          blockRegistry={blockRegistry}
          isEditor
        />
      </div>
    </>
  );
}
