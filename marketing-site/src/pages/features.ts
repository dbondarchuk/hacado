/** Features hub + feature detail pages. */
import {
  featuredFeatures,
  featureGroups,
  features,
  TEMPLATE_PREVIEWS_URL,
  SIGNUP_URL,
} from "../content/site";
import { marketingVideos } from "../content/videos";
import {
  accordion,
  bulletRow,
  button,
  C,
  cardLink,
  container,
  ctaBand,
  ctaButtonWidth,
  featuresShowcase,
  grid,
  heading,
  lightbox,
  marketingFeatureItem,
  pageDoc,
  pageHero,
  section,
  sectionIntro,
  size,
  step,
  sv,
  templatesBrowseSection,
  text,
  videoSection,
} from "../blocks";
import { HERO_HEADER_NAME, keywords } from "./shared";

export function featuresHubPage() {
  return pageDoc({
    title: "Features",
    slug: "features",
    headerName: HERO_HEADER_NAME,
    description:
      "Website, calendar, appointment ops, activity history, payments, messages, gift cards, add-ons, discounts, packages, staff, clients, and a booking funnel - in one admin.",
    keywords: keywords("features", "scheduling", "payments", "website builder"),
    children: [
      pageHero({
        eyebrow: "Features",
        title: "Everything that used to be four subscriptions",
        body: "Website, calendar, appointment ops, activity history, payments, messages, gift cards, add-ons, discounts, packages, staff, clients, and a booking funnel - in one admin.",
        image: "/assets/generated/hero-workspace.png",
        overlay: true,
      }),
      videoSection({
        src: marketingVideos.laptopDashboard,
        eyebrow: "Product tour",
        title: "Built for the way you already work",
        body: "A calm admin for the book, and a public site clients open from Instagram.",
      }),
      ...featureGroups.flatMap((g) => [
        section([
          sectionIntro({ title: g.title, body: g.body }),
          grid(
            features
              .filter((f) => f.group === g.id)
              .map((f) =>
                cardLink({
                  href: `/features/${f.slug}`,
                  title: f.title,
                  body: f.summary,
                  eyebrow: f.eyebrow,
                  image: f.image,
                }),
              ),
            "repeat(2, minmax(0, 1fr))",
            // {
            //   gridTemplateColumns: [
            //     { value: "1fr" },
            //     ...(features.filter((f) => f.group === g.id).length > 1
            //       ? [{ value: "repeat(2, minmax(0, 1fr))", breakpoint: ["md"] }]
            //       : []),
            //     ...(features.filter((f) => f.group === g.id).length > 2
            //       ? [{ value: "repeat(3, minmax(0, 1fr))", breakpoint: ["lg"] }]
            //       : []),
            //   ],
            // },
          ),
        ]),
      ]),
      ctaBand(
        "See it on your own page",
        "Free plan to publish. Solo when you need payments, gift cards, and a domain. Studio for the team.",
      ),
    ],
  });
}

export function featurePage(f: (typeof features)[number]) {
  const isWebsiteBuilder = f.slug === "website-builder";

  return pageDoc({
    title: f.title,
    slug: `features/${f.slug}`,
    headerName: HERO_HEADER_NAME,
    description: f.description,
    keywords: keywords(f.title, f.eyebrow, f.group),
    children: [
      pageHero({
        eyebrow: f.eyebrow,
        title: f.title,
        body: f.description,
        image: f.gallery[0],
        video: f.heroVideo,
        overlay: true,
        buttons: isWebsiteBuilder
          ? [
              button(
                "Browse website templates",
                TEMPLATE_PREVIEWS_URL,
                "brand",
                C.primaryFg,
                { width: ctaButtonWidth },
              ),
              button(
                "Start accepting bookings",
                SIGNUP_URL,
                "outline",
                C.primaryFg,
                { width: ctaButtonWidth },
              ),
            ]
          : undefined,
      }),
      ...(isWebsiteBuilder
        ? [
            templatesBrowseSection({
              title: "Browse templates - no account needed",
              body: "Walk through ready-made booking sites for your industry. Open a demo, click home, booking, and services like a client would, then start free when you are ready.",
            }),
          ]
        : []),
      section([
        grid(
          [
            container(
              [
                heading("h2", f.detailHeadline, {
                  fontSize: sv({ value: 1.875, unit: "rem" }),
                }),
                ...f.bullets.map((b) => bulletRow(b)),
              ],
              { gap: sv({ value: 0.75, unit: "rem" }) },
            ),
            lightbox([f.image], f.title),
          ],
          "repeat(2, minmax(0, 1fr))",
          { alignItems: sv("center") },
        ),
      ]),
      section([lightbox(f.gallery, f.title)], {
        display: sv("flex"),
        flexDirection: [
          { value: "column" },
          { value: "row", breakpoint: ["md"] },
        ],
        overflow: sv("auto"),
        gap: sv({ value: 0.5, unit: "rem" }),
      }),
      ...f.sections.map((sec) =>
        section(
          [
            heading("h2", sec.title, {
              fontSize: sv({ value: 1.875, unit: "rem" }),
            }),
            text(sec.body, { color: sv(C.mutedFg) }),
          ],
          {
            maxWidth: size(72, "rem"),
          },
        ),
      ),
      section([
        sectionIntro({ title: "How you’ll use it" }),
        grid(
          f.steps.map((s, i) =>
            step(String(i + 1).padStart(2, "0"), s.title, s.body),
          ),
          "repeat(3, minmax(0, 1fr))",
        ),
      ]),
      section([sectionIntro({ title: "FAQ" }), accordion(f.faqs)], {
        maxWidth: size(72, "rem"),
      }),
      ctaBand(f.cta.title, f.cta.body),
    ],
  });
}


