"use client";

import { footerDefaultPage } from "@/components/install/defaults/footer";
import type { TEditorBlock } from "@hacado/builder";
import type { Language } from "@hacado/i18n";
import { useI18n } from "@hacado/i18n/client";
import { PageReader } from "@hacado/page-builder/reader";
import { rewriteCatalogUrlsInTree } from "@hacado/page-builder/templates";
import type { Country, Currency } from "@hacado/types";
import { cn } from "@hacado/ui";
import { formatArguments } from "@hacado/utils";
import { useEffect, useMemo, useState } from "react";

export type PreviewHeaderVariant = "solid" | "transparent";

type PreviewChromeProps = {
  header?: PreviewHeaderVariant | null;
  footer?: boolean;
  logoUrl?: string | null;
  businessName?: string;
  /** When set, header nav links to catalog pages under this base (`/c/salon`). */
  basePath?: string | null;
  /** Pre-formatted reader args (general/now/…). Built from demo data when omitted. */
  args?: Record<string, unknown>;
  children: React.ReactNode;
};

/** Demo `general` / `now` args so install footer tokens resolve in previews. */
export function buildPreviewChromeArgs(options?: {
  businessName?: string;
  phone?: string;
  email?: string;
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  country?: Country;
  currency?: Currency;
  language?: Language;
  general?: Record<string, unknown> | null;
}): Record<string, unknown> {
  const fromGeneral = options?.general ?? null;
  const language = options?.language ?? "en";
  const currency =
    (typeof fromGeneral?.currency === "string"
      ? (fromGeneral.currency as Currency)
      : undefined) ??
    options?.currency ??
    "USD";
  const country =
    (typeof fromGeneral?.country === "string"
      ? (fromGeneral.country as Country)
      : undefined) ??
    options?.country ??
    "US";
  const businessName =
    (typeof fromGeneral?.name === "string" && fromGeneral.name.trim()) ||
    options?.businessName?.trim() ||
    "Studio";

  const general = {
    phone: options?.phone ?? "+1 (615) 555-0148",
    email: options?.email ?? "hello@studio.example",
    address: {
      streetAddress: options?.streetAddress ?? "412 Music Row",
      addressLocality: options?.addressLocality ?? "Nashville",
      addressRegion: options?.addressRegion ?? "TN",
      postalCode: options?.postalCode ?? "37203",
      addressCountry: country,
    },
    ...(fromGeneral ?? {}),
    name: businessName,
    currency,
    country,
  };

  return formatArguments(
    {
      general,
      now: new Date(),
    },
    language,
    currency,
    country,
  ) as Record<string, unknown>;
}

/**
 * Header + install-default footer chrome for template and install live previews.
 * With `basePath`, header nav is clickable catalog links.
 */
export function PreviewChrome({
  header,
  footer,
  logoUrl,
  businessName = "Studio",
  basePath,
  args: argsProp,
  children,
}: PreviewChromeProps) {
  const t = useI18n("install");
  const showHeader = Boolean(header);
  const transparent = header === "transparent";
  const [scrolled, setScrolled] = useState(false);
  const homeHref = basePath?.replace(/\/$/, "") || null;
  const aboutHref = homeHref ? `${homeHref}/about` : null;
  const bookHref = homeHref ? `${homeHref}/book` : null;

  const footerArgs = useMemo(
    () => argsProp ?? buildPreviewChromeArgs({ businessName }),
    [argsProp, businessName],
  );

  const footerDocument = useMemo(() => {
    if (!footer) return null;
    const document = footerDefaultPage(
      true,
      {
        contactUsLabel: t("wizard.finish.pageDefaults.footer.contactUsLabel"),
        phoneLabel: t("wizard.finish.pageDefaults.footer.phoneLabel"),
        emailLabel: t("wizard.finish.pageDefaults.footer.emailLabel"),
        addressLabel: t("wizard.finish.pageDefaults.footer.addressLabel"),
        bookNowLabel: t("wizard.finish.pageDefaults.footer.bookNowLabel"),
        cancelOrRescheduleLabel: t(
          "wizard.finish.pageDefaults.footer.cancelOrRescheduleLabel",
        ),
        policiesLabel: t("wizard.finish.pageDefaults.footer.policiesLabel"),
      },
      false,
      false,
      t("wizard.finish.pageDefaults.header.myCabinetLabel"),
      t("wizard.finish.pageDefaults.footer.cancelOrRescheduleLabel"),
    ) as TEditorBlock;

    if (!basePath) return document;
    return rewriteCatalogUrlsInTree(document, basePath);
  }, [footer, t, basePath]);

  useEffect(() => {
    if (!transparent) {
      setScrolled(false);
      return;
    }

    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  const overlaySolid = transparent && scrolled;

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      {showHeader ? (
        <header
          className={cn(
            "z-20 flex w-full items-center justify-between gap-4 px-6 py-4 transition-[background-color,color,box-shadow,border-color] duration-200 md:px-10",
            !transparent &&
              "relative border-b border-border bg-background text-foreground",
            transparent &&
              !overlaySolid &&
              "absolute inset-x-0 top-0 border-b border-transparent bg-transparent text-white",
            transparent &&
              overlaySolid &&
              "fixed inset-x-0 top-0 border-b border-border bg-background/95 text-foreground shadow-sm backdrop-blur-sm",
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            {homeHref ? (
              <a href={homeHref} className="flex min-w-0 items-center gap-3">
                {!!logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-8 w-auto max-w-[9rem] object-contain"
                  />
                )}
                <span
                  className={cn(
                    "truncate text-lg font-semibold tracking-tight",
                    transparent && !overlaySolid && "drop-shadow-sm",
                  )}
                >
                  {businessName}
                </span>
              </a>
            ) : (
              <>
                {!!logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    className="h-8 w-auto max-w-[9rem] object-contain"
                  />
                )}
                <span
                  className={cn(
                    "truncate text-lg font-semibold tracking-tight",
                    transparent && !overlaySolid && "drop-shadow-sm",
                  )}
                >
                  {businessName}
                </span>
              </>
            )}
          </div>
          <nav className="flex items-center gap-1 text-sm font-medium">
            {aboutHref ? (
              <a
                href={aboutHref}
                className="rounded-md px-3 py-1.5 opacity-90 hover:opacity-100"
              >
                About
              </a>
            ) : (
              <span className="rounded-md px-3 py-1.5 opacity-90">About</span>
            )}
            {bookHref ? (
              <a
                href={bookHref}
                className={cn(
                  "rounded-md px-3 py-1.5",
                  transparent && !overlaySolid
                    ? "bg-white/15 text-white"
                    : "bg-primary text-primary-foreground",
                )}
              >
                Book
              </a>
            ) : (
              <span
                className={cn(
                  "rounded-md px-3 py-1.5",
                  transparent && !overlaySolid
                    ? "bg-white/15 text-white"
                    : "bg-primary text-primary-foreground",
                )}
              >
                Book
              </span>
            )}
          </nav>
        </header>
      ) : null}
      <div className="min-w-0 flex-1">{children}</div>
      {footerDocument ? (
        <div className="mt-auto border-t border-border">
          <PageReader document={footerDocument} args={footerArgs} isEditor />
        </div>
      ) : null}
    </div>
  );
}

export function parsePreviewHeaderParam(
  value: string | null | undefined,
): PreviewHeaderVariant | null {
  if (value === "solid" || value === "transparent") return value;
  return null;
}
