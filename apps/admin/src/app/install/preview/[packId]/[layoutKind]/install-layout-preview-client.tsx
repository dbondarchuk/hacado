"use client";

import {
  PreviewChrome,
  type PreviewHeaderVariant,
} from "@/components/install/preview-chrome";
import { generateId, type TEditorBlock } from "@hacado/builder";
import { PageReader, Styling } from "@hacado/page-builder/reader";
import type { StylingConfiguration } from "@hacado/types";
import { useEffect } from "react";

type Props = {
  childrenBlocks: TEditorBlock[];
  styling: StylingConfiguration | null;
  header: PreviewHeaderVariant | null;
  footer: boolean;
  logoUrl?: string | null;
  businessName?: string;
};

function isNavigatingControl(el: Element): boolean {
  if (el.closest("a[href]")) return true;
  const linkLike = el.closest("[role='link']");
  if (linkLike) return true;
  const button = el.closest("button, [role='button']");
  if (!button) return false;
  const formAction = button.getAttribute("formaction");
  if (formAction) return true;
  if (button.hasAttribute("data-href")) return true;
  return false;
}

function blockNavigation(event: Event) {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (!isNavigatingControl(target)) return;
  event.preventDefault();
  event.stopPropagation();
}

export function InstallLayoutPreviewClient({
  childrenBlocks,
  styling,
  header,
  footer,
  logoUrl,
  businessName,
}: Props) {
  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute("data-preview-ready", "true");

    window.document.addEventListener("click", blockNavigation, true);
    window.document.addEventListener("auxclick", blockNavigation, true);
    return () => {
      window.document.removeEventListener("click", blockNavigation, true);
      window.document.removeEventListener("auxclick", blockNavigation, true);
    };
  }, []);

  const document = {
    id: generateId(),
    type: "PageLayout" as const,
    data: {
      fontFamily: "PRIMARY" as const,
      fullWidth: true,
      children: childrenBlocks,
    },
  };

  const page = <PageReader document={document} isEditor />;

  return (
    <div data-install-layout-preview className="min-h-screen bg-background">
      <style>{`a[href] { pointer-events: none; }`}</style>
      <Styling styling={styling ?? undefined} />
      {header || footer ? (
        <PreviewChrome
          header={header}
          footer={footer}
          logoUrl={logoUrl}
          businessName={businessName}
        >
          {page}
        </PreviewChrome>
      ) : (
        page
      )}
    </div>
  );
}
