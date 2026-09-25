import {
  CatalogMarketingFooter,
  CatalogMarketingHeader,
} from "@/components/catalog/marketing-chrome";
import type { BaseAllKeys } from "@hacado/i18n";
import { getI18nAsync } from "@hacado/i18n/server";
import {
  catalogPagePath,
  packIdToCatalogSlug,
  WEBSITE_PACK_IDS,
  WEBSITE_PACKS,
  type PageLayoutKind,
  type WebsitePackId,
} from "@hacado/page-builder/templates";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Website templates — Hacado",
  description:
    "Explore ready-made booking website templates for salons, spas, studios, and more.",
  robots: { index: true, follow: true },
};

const LAYOUT_KINDS: PageLayoutKind[] = [
  "home",
  "booking",
  "service",
  "about",
  "terms",
];

function seriesOf(packId: WebsitePackId): "A" | "B" | "C" | "D" {
  if (packId.endsWith("_d")) return "D";
  if (packId.endsWith("_c")) return "C";
  if (packId.endsWith("_b")) return "B";
  return "A";
}

function pageLabel(kind: PageLayoutKind): string {
  if (kind === "booking") return "book";
  return kind;
}

const SERIES_ORDER: Array<"A" | "B" | "C" | "D"> = ["A", "B", "C", "D"];

export default async function TemplatePreviewsIndexPage() {
  const t = await getI18nAsync({ locale: "en" });
  const bySeries = SERIES_ORDER.map((series) => ({
    series,
    packs: WEBSITE_PACK_IDS.filter((id) => seriesOf(id) === series),
  }));

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <CatalogMarketingHeader />
      <main className="relative flex-1">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-transparent to-transparent"
        />
        <div className="mx-auto max-w-6xl px-6 py-14 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Templates
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Websites that book themselves
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Browse full-site demos for every industry pack. Open a template and
            click through pages the way your clients will.
          </p>

          {bySeries.map(({ series, packs }) => (
            <section key={series} className="mt-16">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Series {series}
              </h2>
              <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {packs.map((packId) => {
                  const pack = WEBSITE_PACKS[packId];
                  const cover = pack.media.generic;
                  const homeHref = catalogPagePath(packId, "home");
                  const name = t(pack.displayName);
                  const tagline = t(
                    `builder.pageBuilder.pageTemplates.packs.${packId}.tagline` as BaseAllKeys,
                  );

                  const variation = packIdToCatalogSlug(packId).replace(
                    /-/g,
                    " ",
                  );

                  return (
                    <article
                      key={packId}
                      className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition hover:border-primary/30 hover:shadow-md"
                    >
                      <Link href={homeHref} className="group block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                          src={cover}
                          alt=""
                        />
                        <div className="space-y-1 p-5 pb-3">
                          <div className="text-xs uppercase tracking-widest text-muted-foreground">
                            {variation}
                          </div>
                          <div className="font-display text-xl font-semibold tracking-tight">
                            {name}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {tagline}
                          </p>
                        </div>
                      </Link>
                      <div className="flex flex-wrap gap-2 px-5 pb-5">
                        {LAYOUT_KINDS.map((kind) => (
                          <Link
                            key={kind}
                            href={
                              kind === "service"
                                ? catalogPagePath(
                                    packId,
                                    "service",
                                    pack.demoServices[0]?.slug,
                                  )
                                : catalogPagePath(packId, kind)
                            }
                            className="rounded-md bg-muted px-2.5 py-1 text-xs capitalize text-muted-foreground transition hover:bg-primary/10 hover:text-foreground"
                          >
                            {pageLabel(kind)}
                          </Link>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
      <CatalogMarketingFooter />
    </div>
  );
}
