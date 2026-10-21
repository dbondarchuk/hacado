/** Topic landing pages + redirects. */
import {
  allSeoLandingPages,
  seoLandingAlternativeRedirects,
  type SeoLandingPage,
} from "../content/seoPages";
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
  relatedLinks,
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
import { faqJsonLd } from "./compare";

export function seoLandingPage(p: SeoLandingPage) {
  const cta = p.cta ?? {
    title: "Start free on Hacado",
    body: "Publish a branded booking website. Cancel anytime.",
  };
  return pageDoc({
    title: p.seoTitle,
    slug: p.slug,
    headerName: HERO_HEADER_NAME,
    description: p.seoDescription,
    keywords: keywords(...p.keywords),
    doNotCombine: { title: true, description: true, keywords: true },
    children: [
      pageHero({
        eyebrow: p.heroEyebrow,
        title: p.heroTitle,
        body: p.heroBody,
        image: p.image,
        overlay: true,
      }),
      p.bullets?.length
        ? section([
            sectionIntro({ title: "What you get" }),
            container(
              p.bullets.map((b) => bulletRow(b)),
              { gap: gap(0.75) },
            ),
          ])
        : spacer(0),
      section(
        p.sections.map((s) =>
          container(
            [
              heading("h2", s.title, {
                fontSize: sv({ value: 1.5, unit: "rem" }),
              }),
              text(s.body, { color: sv(C.mutedFg) }),
            ],
            { gap: gap(0.75), maxWidth: size(42, "rem") },
          ),
        ),
        { gap: gap(1.5) },
      ),
      p.links?.length
        ? section([
            sectionIntro({
              title: "Keep reading",
              body: "Related guides, features, and compare pages.",
            }),
            relatedLinks(p.links),
          ])
        : spacer(0),
      p.faqs?.length
        ? section([
            sectionIntro({ title: "FAQ" }),
            accordion(p.faqs),
            faqJsonLd(p.faqs),
          ])
        : spacer(0),
      ctaBand(cta.title, cta.body),
    ],
  });
}

export function seoLandingRedirectPages() {
  return seoLandingAlternativeRedirects().map((r) =>
    pageDoc({
      title: r.title,
      slug: r.from,
      description: r.description,
      keywords: keywords("guide"),
      doNotCombine: { title: true, description: true },
      children: [redirect(r.to, true)],
    }),
  );
}


