/** Use-case hub + detail pages. */
import { useCases } from "../content/useCases";
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

export function useCasesHubPage() {
  const beauty = useCases.filter((u) => u.cluster === "beauty");
  const other = useCases.filter((u) => u.cluster === "other");
  const card = (u: (typeof useCases)[number]) =>
    cardLink({
      href: `/use-cases/${u.slug}`,
      title: u.title,
      body: u.summary,
      eyebrow: u.persona,
      image: u.image,
    });

  return pageDoc({
    title: "Use cases",
    slug: "use-cases",
    headerName: HERO_HEADER_NAME,
    description:
      "Studios and chairs, coaches and clinics, tutors, teams, and businesses opening a book from zero.",
    keywords: keywords("use cases", "salons", "coaches", "tutors"),
    children: [
      pageHero({
        eyebrow: "Use cases",
        title: "Built for people who sell time",
        body: "Studios and chairs, coaches and clinics, tutors, teams, and businesses opening a book from zero. The first customer was a nail studio - the product is not limited to one trade.",
        image: "/assets/generated/usecase-coach.png",
        overlay: true,
      }),
      videoSection({
        src: marketingVideos.salonLaptop,
        eyebrow: "Studios",
        title: "The book lives next to the chair",
        body: "Salon desks, solo chairs, and clinic floors - one branded site for the people who sell time.",
      }),
      section([
        sectionIntro({
          eyebrow: "Beauty & personal care",
          title: "Studios and chairs",
        }),
        grid(beauty.map(card), "repeat(2, minmax(0, 1fr))"),
      ]),
      section([
        sectionIntro({
          eyebrow: "Practices, teams, and launch",
          title: "Same book, different trade",
          body: "Coaches, clinics, tutors, and anyone starting without a website use the same site, calendar, and payments.",
        }),
        grid(other.map(card), "repeat(2, minmax(0, 1fr))"),
      ]),
      ctaBand("Your book, your site", "Publish a branded page this afternoon."),
    ],
  });
}

export function useCasePage(u: (typeof useCases)[number]) {
  return pageDoc({
    title: u.title,
    slug: `use-cases/${u.slug}`,
    headerName: HERO_HEADER_NAME,
    description: u.summary,
    keywords: keywords(u.title, u.persona),
    children: [
      pageHero({
        eyebrow: u.persona,
        title: u.title,
        body: u.summary,
        image: u.image,
        overlay: true,
      }),
      section([
        grid(
          [
            container(
              [
                heading("h2", "The mess", {
                  fontSize: sv({ value: 1.875, unit: "rem" }),
                }),
                text(u.problem, { color: sv(C.mutedFg) }),
              ],
              { gap: sv({ value: 0.75, unit: "rem" }) },
            ),
            container(
              [
                heading("h2", "With Hacado", {
                  fontSize: sv({ value: 1.875, unit: "rem" }),
                }),
                text(u.outcome, { color: sv(C.mutedFg) }),
              ],
              { gap: sv({ value: 0.75, unit: "rem" }) },
            ),
          ],
          "repeat(2, minmax(0, 1fr))",
        ),
      ]),
      section([
        grid(
          u.bullets.map((b) =>
            container([bulletRow(b)], {
              padding: [
                {
                  value: {
                    top: { value: 1, unit: "rem" },
                    bottom: { value: 1, unit: "rem" },
                    left: { value: 1, unit: "rem" },
                    right: { value: 1, unit: "rem" },
                  },
                },
              ],
              borderRadius: [{ value: { value: 12, unit: "px" } }],
              borderStyle: sv("solid"),
              borderWidth: [{ value: { value: 1, unit: "px" } }],
              borderColor: sv(C.border),
              backgroundColor: sv(C.card),
            }),
          ),
          "repeat(2, minmax(0, 1fr))",
        ),
      ]),
      ...u.sections.map((sec) =>
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
      section([lightbox(u.gallery, u.title)], {
        display: sv("flex"),
        flexDirection: [
          { value: "column" },
          { value: "row", breakpoint: ["md"] },
        ],
        overflow: sv("auto"),
        gap: sv({ value: 0.5, unit: "rem" }),
      }),
      section([
        sectionIntro({ title: "Get live" }),
        grid(
          u.steps.map((s, i) =>
            step(String(i + 1).padStart(2, "0"), s.title, s.body),
          ),
          "repeat(3, minmax(0, 1fr))",
        ),
      ]),
      section([sectionIntro({ title: "FAQ" }), accordion(u.faqs)]),
      u.related.length
        ? section([
            sectionIntro({ title: "Related" }),
            container(
              u.related.map((r) =>
                link(`${r.label} →`, r.href, {
                  color: sv(C.foreground),
                  fontWeight: sv("500"),
                  backgroundColor: sv(C.card),
                  borderRadius: radius(9999999),
                  borderStyle: sv("solid"),
                  borderWidth: size(1, "px"),
                  transition: [{ value: "all 0.3s ease" }],
                  textAlign: [{ value: "center" }],
                  borderColor: [
                    { value: C.border },
                    {
                      value: C.primary,
                      state: [
                        {
                          state: "hover",
                          target: {
                            type: "self",
                          },
                        },
                      ],
                    },
                  ],
                  padding: pad(0.5, 1, 0.5, 1),
                  gap: sv({ value: 0.5, unit: "rem" }),
                  width: [
                    {
                      value: { value: 100, unit: "%" },
                      breakpoint: ["max-sm"],
                    },
                  ],
                }),
              ),
              {
                display: sv("flex"),
                flexDirection: [
                  { value: "column" },
                  { value: "row", breakpoint: ["sm"] },
                ],
                justifyContent: sv("center"),
                alignItems: sv("center"),
                gap: sv({ value: 0.75, unit: "rem" }),
              },
            ),
          ])
        : spacer(0),
      ctaBand(
        "Open your book",
        "Free to start. Solo when you need deposits and a domain. Studio when the team needs seats.",
      ),
    ],
  });
}


