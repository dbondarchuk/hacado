/** Compare hub + vendor pages. */
import {
  compareAlternativeRedirects,
  compareHub,
  comparePages,
  competitorColumns,
  competitorRows,
  otherTools,
} from "../content/site";
import { marketingVideos } from "../content/videos";
import {
  accordion,
  banner,
  bid,
  bulletRow,
  button,
  C,
  cardLink,
  comparePointCard,
  comparisonTable,
  container,
  cookieAcknowledgmentBanner,
  ctaBand,
  ctaButtonWidth,
  customHtml,
  DOCS_URL,
  featuresShowcase,
  formsForm,
  gap,
  GITHUB_ISSUES_URL,
  grid,
  heading,
  homeHero,
  icon,
  image,
  inlineText,
  integrationFeatureItem,
  lightbox,
  link,
  marketingFeatureItem,
  pad,
  pageDoc,
  pageHero,
  planCard,
  radius,
  redirect,
  scrollingLogos,
  section,
  sectionIntro,
  size,
  spacer,
  SIGNUP_URL as START,
  statCell,
  step,
  SUPPORT_EMAIL,
  sv,
  templatesBrowseSection,
  testimonialCard,
  text,
  texts,
  videoSection,
} from "../blocks";
import { HERO_HEADER_NAME, keywords } from "./shared";

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  const payload = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return customHtml(
    `<script type="application/ld+json">${JSON.stringify(payload).replace(/</g, "\\u003c")}</script>`,
  );
}

export function compareHubPage() {
  return pageDoc({
    title: compareHub.seoTitle,
    slug: "compare",
    headerName: HERO_HEADER_NAME,
    description: compareHub.seoDescription,
    keywords: keywords(...compareHub.keywords),
    doNotCombine: { title: true, description: true, keywords: true },
    children: [
      pageHero({
        eyebrow: compareHub.heroEyebrow,
        title: compareHub.heroTitle,
        body: compareHub.heroBody,
        image: "/assets/generated/hero-workspace.png",
        overlay: true,
      }),
      videoSection({
        src: marketingVideos.phoneScroll,
        eyebrow: "Own the book",
        title: "Leave the marketplace. Keep the clients.",
        body: "Compare Hacado to the tools people search when they want their own brand back.",
      }),
      section([
        comparisonTable({
          cornerHeader: "Capability",
          columns: [...competitorColumns],
          rows: competitorRows,
          highlightCol: 0,
          checkmarks: true,
        }),
        text(
          "“Limited” means the capability exists in a thinner form or on higher plans / add-ons. Marketplace tools may charge commissions; Hacado does not run a client directory.",
          { color: sv(C.mutedFg), fontSize: sv({ value: 0.75, unit: "rem" }) },
        ),
      ]),
      section([
        sectionIntro({
          title: "Read a side-by-side",
          body: "Each page is written for people searching for an alternative to that tool.",
        }),
        grid(
          comparePages.map((c) =>
            cardLink({ href: `/compare/${c.slug}`, title: c.navLabel }),
          ),
          "repeat(2, minmax(0, 1fr))",
          {
            gridTemplateColumns: [
              { value: "1fr" },
              { value: "repeat(2, minmax(0, 1fr))", breakpoint: ["sm"] },
              { value: "repeat(3, minmax(0, 1fr))", breakpoint: ["lg"] },
            ],
          },
        ),
      ]),
      section([
        sectionIntro({
          eyebrow: "Also in this category",
          title: "Other similar tools",
          body: "We did not build full pages for these - they show up in the same buying decision.",
        }),
        grid(
          otherTools.map((t) =>
            container(
              [
                heading("h3", t.name, {
                  fontSize: sv({ value: 1.25, unit: "rem" }),
                }),
                text(t.blurb, { color: sv(C.mutedFg) }),
              ],
              {
                padding: [
                  {
                    value: {
                      top: { value: 1.5, unit: "rem" },
                      bottom: { value: 1.5, unit: "rem" },
                      left: { value: 1.5, unit: "rem" },
                      right: { value: 1.5, unit: "rem" },
                    },
                  },
                ],
                borderRadius: [{ value: { value: 16, unit: "px" } }],
                borderStyle: sv("solid"),
                borderWidth: [{ value: { value: 1, unit: "px" } }],
                borderColor: sv(C.border),
                backgroundColor: sv(C.card),
                gap: sv({ value: 0.5, unit: "rem" }),
              },
            ),
          ),
          "repeat(3, minmax(0, 1fr))",
        ),
      ]),
      ctaBand("Try Hacado on Free", "No marketplace. Your site, your book."),
    ],
  });
}

export function comparePage(c: (typeof comparePages)[number]) {
  const cta = c.cta ?? {
    title: "See Hacado on your services",
    body: "Start free. Compare with your real week, not a spreadsheet.",
  };
  return pageDoc({
    title: c.seoTitle,
    slug: `compare/${c.slug}`,
    headerName: HERO_HEADER_NAME,
    description: c.seoDescription,
    keywords: keywords(...c.keywords),
    doNotCombine: { title: true, description: true, keywords: true },
    children: [
      pageHero({
        eyebrow: c.heroEyebrow,
        title: c.heroTitle,
        body: c.lede,
        image: c.image,
        overlay: true,
      }),
      section(
        c.points.map((p) =>
          comparePointCard({
            title: p.title,
            hacadoTitle: p.hacadoTitle,
            otherTitle: p.otherTitle,
            hacado: p.hacado,
            other: p.other,
            competitor: c.competitor,
          }),
        ),
        { gap: gap(1.5) },
      ),
      c.related?.length
        ? section([
            sectionIntro({
              title: "If you book clients, not internal meetings",
              body: "Dedicated pages for businesses that outgrew a Calendly link.",
            }),
            container(
              c.related.map((r) =>
                link(`${r.label} →`, r.href, {
                  color: sv(C.foreground),
                  fontWeight: sv("500"),
                  backgroundColor: sv(C.card),
                  borderRadius: radius(9999999),
                  borderStyle: sv("solid"),
                  borderWidth: size(1, "px"),
                  padding: pad(0.5, 1, 0.5, 1),
                }),
              ),
              {
                display: sv("flex"),
                flexDirection: [
                  { value: "column" },
                  { value: "row", breakpoint: ["sm"] },
                ],
                gap: sv({ value: 0.75, unit: "rem" }),
              },
            ),
          ])
        : spacer(0),
      section([
        sectionIntro({
          title: `Is Hacado a good ${c.competitor} alternative?`,
          body: `Straight answers for people comparing Hacado vs ${c.competitor}.`,
        }),
        accordion(c.faqs),
        faqJsonLd(c.faqs),
      ]),
      ctaBand(cta.title, cta.body),
    ],
  });
}

export function compareAlternativeRedirectPages() {
  return compareAlternativeRedirects().map((r) =>
    pageDoc({
      title: r.title,
      slug: r.from,
      description: r.description,
      keywords: keywords("alternative"),
      doNotCombine: { title: true, description: true },
      children: [redirect(r.to, true)],
    }),
  );
}


