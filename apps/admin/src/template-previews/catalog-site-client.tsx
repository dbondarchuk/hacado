"use client";

import { authClient } from "@/app/auth-client";
import { preferredWebsitePackHref } from "@/components/install/constants";
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
import { Button } from "@hacado/ui";
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
  const { data: session } = authClient.useSession();
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

  const onUseTemplate = () => {
    const user = session?.user as
      | { organizationInstalled?: boolean }
      | undefined;
    if (session?.user) {
      router.push(
        user?.organizationInstalled
          ? "/dashboard"
          : preferredWebsitePackHref("/checkout", packId),
      );
      return;
    }
    router.push(preferredWebsitePackHref("/auth/signup", packId));
  };

  return (
    <div
      data-template-preview
      data-catalog-site
      className="min-h-screen bg-background"
    >
      <div className="sticky top-0 z-50 border-b border-border/60 bg-background/95 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-2.5">
          <Link
            href={CATALOG_INDEX_PATH}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:gap-2"
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span className="hidden sm:inline">All templates</span>
            <span className="sm:hidden">Templates</span>
          </Link>
          <span className="min-w-0 flex-1 truncate text-center text-xs text-muted-foreground sm:text-sm">
            <span className="sm:hidden">{businessName}</span>
            <span className="hidden sm:inline">Preview · {businessName}</span>
          </span>
          <Button
            type="button"
            size="sm"
            className="ml-auto shrink-0 whitespace-nowrap px-2.5 text-xs sm:ml-0 sm:px-3 sm:text-sm"
            onClick={onUseTemplate}
          >
            <span className="sm:hidden">Use it</span>
            <span className="hidden sm:inline">Use this template</span>
          </Button>
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
