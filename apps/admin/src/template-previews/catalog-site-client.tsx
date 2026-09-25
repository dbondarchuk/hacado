"use client";

import {
  buildPreviewChromeArgs,
  PreviewChrome,
  type PreviewHeaderVariant,
} from "@/components/install/preview-chrome";
import { generateId, type TEditorBlock } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { ReplaceOriginalColors } from "@hacado/page-builder-base/reader";
import { PageReader, Styling } from "@hacado/page-builder/reader";
import {
  CATALOG_INDEX_PATH,
  getPackSuggestedStyling,
  getWebsitePack,
  isCatalogInternalPath,
  rewriteCatalogInternalPath,
  rewriteCatalogUrlsInTree,
  type WebsitePackId,
} from "@hacado/page-builder/templates";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

type Props = {
  packId: WebsitePackId;
  basePath: string;
  header: PreviewHeaderVariant;
  childrenBlocks: TEditorBlock[];
  previewDelayMs?: number;
};

export function CatalogSiteClient({
  packId,
  basePath,
  header,
  childrenBlocks,
  previewDelayMs = 800,
}: Props) {
  const t = useI18n();
  const router = useRouter();
  const pack = getWebsitePack(packId);
  const businessName = t(pack.displayName);
  const packStyling = useMemo(() => getPackSuggestedStyling(packId), [packId]);
  const chromeArgs = useMemo(
    () => buildPreviewChromeArgs({ businessName }),
    [businessName],
  );

  const rewrittenChildren = useMemo(
    () => rewriteCatalogUrlsInTree(childrenBlocks, basePath),
    [childrenBlocks, basePath],
  );

  const document = useMemo(
    () => ({
      id: generateId(),
      type: "PageLayout" as const,
      data: {
        fontFamily: "PRIMARY" as const,
        fullWidth: true,
        children: rewrittenChildren,
      },
    }),
    [rewrittenChildren],
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.removeAttribute("data-preview-ready");

    const markReady = () => {
      root.setAttribute("data-preview-ready", "true");
    };

    const fontsReady = window.document.fonts?.ready;
    if (fontsReady) {
      void fontsReady.then(() => {
        window.setTimeout(markReady, previewDelayMs);
      });
      return;
    }

    const timeout = window.setTimeout(markReady, previewDelayMs);
    return () => window.clearTimeout(timeout);
  }, [document, previewDelayMs]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      if (href.startsWith("tel:") || href.startsWith("http")) return;

      let pathname = href;
      try {
        if (href.startsWith("/")) {
          pathname = href.split("?")[0] ?? href;
        } else {
          pathname = new URL(href, window.location.origin).pathname;
        }
      } catch {
        return;
      }

      if (!isCatalogInternalPath(pathname)) return;

      event.preventDefault();
      event.stopPropagation();
      router.push(rewriteCatalogInternalPath(basePath, pathname));
    };

    window.document.addEventListener("click", onClick, true);
    return () => window.document.removeEventListener("click", onClick, true);
  }, [basePath, router]);

  return (
    <div
      data-template-preview
      data-catalog-site
      className="min-h-screen bg-background"
    >
      <div className="sticky top-0 z-50 border-b border-border/60 bg-background/95 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <Link
            href={CATALOG_INDEX_PATH}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            All templates
          </Link>
          <span className="truncate text-xs text-muted-foreground sm:text-sm">
            Preview · {businessName}
          </span>
        </div>
      </div>
      <Styling styling={packStyling} />
      <ReplaceOriginalColors />
      <PreviewChrome
        header={header}
        footer
        businessName={businessName}
        basePath={basePath}
        args={chromeArgs}
      >
        <PageReader document={document} args={chromeArgs} isEditor />
      </PreviewChrome>
    </div>
  );
}
