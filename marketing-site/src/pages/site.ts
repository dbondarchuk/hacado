/** Pricing, integrations, company, legal, 404. */
import { integrationGroups } from "../content/integrations";
import {
  privacySections,
  privacyUpdated,
  termsSections,
  termsUpdated,
  type LegalSection,
} from "../content/legal";
import {
  aboutAudiences,
  integrations,
  planComparisonRows,
  plans,
  pricingFaqs,
  SIGNIN_URL,
  SIGNUP_URL,
  site,
} from "../content/site";
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
import { HERO_HEADER_NAME, MAIN_HEADER_NAME, keywords } from "./shared";

export function pricingPage() {
  return pageDoc({
    title: "Pricing",
    slug: "pricing",
    headerName: HERO_HEADER_NAME,
    description:
      "Every plan includes your branded page. Solo is $29/month. Studio is $59/month, with extra seats from $4.",
    keywords: keywords("pricing", "free", "solo", "studio"),
    children: [
      pageHero({
        eyebrow: "Pricing",
        title: "Every plan includes your branded page",
        body: "Pick the size that fits. Change whenever you like. Solo is $29/month. Studio is $59/month, with extra seats from $4.",
        image: "/assets/photos/desk-calendar.jpg",
        overlay: true,
      }),
      section([
        grid(
          plans.map((p) =>
            planCard({
              name: p.name,
              subtitle: p.subtitle,
              price: p.price,
              period: p.period,
              footnote: p.footnote,
              badge: p.badge,
              cta: p.cta,
              featured: p.featured,
              includes: p.includes,
              benefits: p.benefits,
            }),
          ),
          "repeat(3, minmax(0, 1fr))",
          { gap: gap(2), overflow: sv("visible") },
        ),
      ]),
      section([
        sectionIntro({ title: "Plan comparison" }),
        comparisonTable({
          cornerHeader: "Feature",
          columns: ["Free", "Solo", "Studio"],
          rows: planComparisonRows.map((r) => ({
            feature: r.feature,
            cells: [r.free, r.solo, r.studio],
          })),
          highlightCol: 1,
        }),
      ]),
      section([sectionIntro({ title: "Billing FAQ" }), accordion(pricingFaqs)]),
      ctaBand(
        "Cancel anytime",
        "No long-term contract, no hidden fees. Manage the plan in your Polar customer portal.",
      ),
    ],
  });
}

export function integrationsPage() {
  return pageDoc({
    title: "Integrations",
    slug: "integrations",
    headerName: HERO_HEADER_NAME,
    description:
      "Calendars, video, payments, Google Analytics, email, SMS, webhooks, and CardDAV contacts. Turn on only what you need from the app store.",
    keywords: keywords(
      "integrations",
      "Google Calendar",
      "Google Analytics",
      "Stripe",
      "Zoom",
      "Resend",
    ),
    children: [
      pageHero({
        eyebrow: "Integrations",
        title: "Calendars, video, money, and analytics - already connected",
        body: "Turn on only what you need from the app store. Click a card for what it does, why you would use it, and how to connect. ICS is an import for busy time - not an export of your book.",
        image: "/assets/generated/mock-admin-calendar.png",
        overlay: true,
      }),
      scrollingLogos(
        integrations,
        "Works with Google Calendar, Outlook, Zoom, payments, Resend, and Google Analytics",
      ),
      ...integrationGroups.map((g) =>
        section([
          sectionIntro({ title: g.title, body: g.intro }),
          featuresShowcase(g.items.map(integrationFeatureItem), {
            transparentIcon: true,
            maxColumns: g.maxColumns,
          }),
        ]),
      ),
      section([
        sectionIntro({
          title: "Deep-dive pages",
          body: "More detail on the connections people ask about most.",
        }),
        container(
          [
            link("Google Calendar booking website →", "/integrations/google-calendar", {
              color: sv(C.foreground),
              fontWeight: sv("500"),
            }),
            link("Outlook / Microsoft 365 booking →", "/integrations/outlook", {
              color: sv(C.foreground),
              fontWeight: sv("500"),
            }),
            link("Stripe for appointments →", "/integrations/stripe", {
              color: sv(C.foreground),
              fontWeight: sv("500"),
            }),
            link("Zoom on your booking site →", "/integrations/zoom", {
              color: sv(C.foreground),
              fontWeight: sv("500"),
            }),
            link("SMS & email notifications →", "/integrations/sms-notifications", {
              color: sv(C.foreground),
              fontWeight: sv("500"),
            }),
            link("Google Analytics 4 →", "/integrations/google-analytics", {
              color: sv(C.foreground),
              fontWeight: sv("500"),
            }),
          ],
          {
            display: sv("flex"),
            flexDirection: sv("column"),
            gap: gap(0.75),
            alignItems: sv("flex-start"),
          },
        ),
      ]),
      ctaBand(
        "Connect on day one",
        "Google Calendar and Google Analytics take a couple of clicks after signup. CalDAV and ICS import are in the same store.",
      ),
    ],
  });
}

export function aboutPage() {
  return pageDoc({
    title: "About",
    slug: "about",
    headerName: HERO_HEADER_NAME,
    description:
      "Hacado exists so you do not have to duct-tape a website, a scheduler, a payment link, and a reminder app.",
    keywords: keywords("about", "story"),
    children: [
      pageHero({
        eyebrow: "About",
        title: "A booking operating system for people who sell time",
        body: "Hacado exists so you do not have to duct-tape a website, a scheduler, a payment link, and a reminder app - whether you run a studio, a practice, lessons, or a small team.",
        image: "/assets/generated/usecase-salon.png",
        overlay: true,
      }),
      section([
        grid(
          [
            image("/assets/photos/nails-studio.jpg", "Studio origin"),
            container(
              [
                inlineText("Why we started", {
                  fontWeight: sv("600"),
                  fontSize: sv({ value: 0.875, unit: "rem" }),
                  color: sv(C.brand),
                  textTransform: sv("uppercase"),
                  letterSpacing: sv({ value: 0.025, unit: "rem" }),
                }),
                heading("h2", "It began with one nail studio", {
                  fontSize: sv({ value: 1.875, unit: "rem" }),
                  textAlign: sv("left"),
                  fontWeight: sv("500"),
                }),
                texts(
                  [
                    "I started Hacado because my wife opened her own nail studio and needed a website, a booking system, and tools she could actually shape - not a generic link and a pile of apps.",
                    "It grew from a very small project that simply took her calendar and showed available times to people. Then the business asked for more, so the product did too: deposits when people started not showing up; a website builder when there was real content to publish; cancellation and reschedule flows - policies, refunds, deposit forfeiture - when people started canceling and moving appointments.",
                    "That origin is a studio. The product is not a beauty-only tool. Anyone who sells time hits the same problems: a public page, a truthful calendar, reminders, money rules, and a client list you actually own.",
                  ],
                  { color: sv(C.mutedFg) },
                ),
              ],
              { gap: sv({ value: 0.75, unit: "rem" }) },
            ),
          ],
          "repeat(2, minmax(0, 1fr))",
          { alignItems: sv("flex-start") },
        ),
      ]),
      section([
        sectionIntro({
          title: "Who we build for",
          body: "The first customer was a nail studio. We still care deeply about chairs and fills. We also build for coaches, clinics, tutors, multi-person teams, and people launching without a website. If the work is appointments, Hacado is in scope.",
        }),
        grid(
          aboutAudiences.map((a) =>
            cardLink({ href: a.href, title: a.title, body: a.body }),
          ),
          "repeat(3, minmax(0, 1fr))",
        ),
      ]),
      ctaBand(
        "Come build your book",
        "Free to start. We would rather you try it on a real week, not a demo that never books.",
      ),
    ],
  });
}

export function supportPage() {
  const channels = [
    {
      title: "Create a support case",
      body: "Open a GitHub issue so we can track your request and follow up until it is resolved.",
      href: GITHUB_ISSUES_URL,
      cta: "Open GitHub Issues",
      icon: "github",
    },
    {
      title: "Email support",
      body: "Reach the team directly. Include your workspace name and a brief summary of what you need.",
      href: `mailto:${SUPPORT_EMAIL}`,
      cta: SUPPORT_EMAIL,
      icon: "mail",
    },
    {
      title: "Knowledge base",
      body: "Browse product documentation for setup guides, integrations, apps, and day-to-day use.",
      href: DOCS_URL,
      cta: "Go to Docs",
      icon: "book-open",
    },
  ];

  return pageDoc({
    title: "Support",
    slug: "support",
    headerName: HERO_HEADER_NAME,
    description:
      "Hours, first-response targets, and the channels we monitor. GitHub Issues, email, and docs.",
    keywords: keywords("support", "help"),
    children: [
      pageHero({
        eyebrow: "Support",
        title: "Support",
        body: "Hacado is built for busy teams who depend on scheduling every day. You deserve a dependable way to reach us when something blocks you. Below you’ll find our hours, targets for first responses, and the channels we monitor.",
        image: "/assets/photos/desk-calendar.jpg",
        overlay: true,
      }),
      section([
        grid(
          channels.map((c) =>
            container(
              [
                icon(c.icon, {
                  width: sv({ value: 2, unit: "rem" }),
                  height: sv({ value: 2, unit: "rem" }),
                }),
                heading("h3", c.title, {
                  fontSize: sv({ value: 1.25, unit: "rem" }),
                }),
                text(c.body, { color: sv(C.mutedFg) }),
                link(`${c.cta} →`, c.href, {
                  color: sv(C.primary),
                  fontWeight: sv("600"),
                }),
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
                gap: sv({ value: 0.75, unit: "rem" }),
              },
            ),
          ),
          "repeat(3, minmax(0, 1fr))",
        ),
      ]),
      section([
        heading("h2", "Hours of operation", {
          fontSize: sv({ value: 1.5, unit: "rem" }),
        }),
        text(
          "Support is staffed Monday through Friday, 9:00 a.m. to 6:00 p.m. Eastern Time (US), excluding major US holidays. Automated systems (sign-up, billing, confirmations) continue to operate at all times.",
          { color: sv(C.mutedFg) },
        ),
        heading("h2", "Response times", {
          fontSize: sv({ value: 1.5, unit: "rem" }),
        }),
        texts(
          [
            `For tickets sent through GitHub Issues or ${SUPPORT_EMAIL} during support hours above, our target is an initial reply within one business day (same calendar day whenever practicable). Messages received outside those hours roll to the next business morning. Severity-1 outages (the service is broadly unavailable or data at risk) are prioritized ahead of routine questions - describe the impact in your subject line so we can triage quickly.`,
            "This describes the response window you should plan for a first acknowledgment and initial guidance. Complex bugs or feature work may take longer to fully resolve after we reply.",
          ],
          { color: sv(C.mutedFg) },
        ),
        heading("h2", "Phone support", {
          fontSize: sv({ value: 1.5, unit: "rem" }),
        }),
        text(
          "We do not publish a telephone support line at this time. Email and GitHub Issues give us enough context - including screenshots and logs when needed - to help you faster without keeping you on hold.",
          { color: sv(C.mutedFg) },
        ),
      ]),
    ],
  });
}

export function contactPage() {
  return pageDoc({
    title: "Contact",
    slug: "contact",
    headerName: HERO_HEADER_NAME,
    description:
      "Send Hacado a message. We reply by email. For how-tos, see Support or the docs.",
    keywords: keywords("contact", "support"),
    children: [
      pageHero({
        eyebrow: "Contact",
        title: "Send us a message",
        body: "Product, billing, or account questions - fill out the form and we'll reply by email.",
        image: "/assets/photos/phone-booking.jpg",
        overlay: true,
      }),
      section(
        [
          container(
            [
              formsForm({
                formId: "6aa80543feb05d070305eff2",
                formsAppId: "6aa8050efeb05d070305eff1",
              }),
            ],
            {
              width: size(100, "%"),
              maxWidth: size(28, "rem"),
              backgroundColor: sv(C.card),
              borderStyle: sv("solid"),
              borderWidth: size(1, "px"),
              borderColor: sv(C.border),
              borderRadius: radius(16),
              padding: pad(0.5, 0.5, 0.5, 0.5),
            },
          ),
          container(
            [
              button("Support", "/support", "outline"),
              button("Docs", DOCS_URL, "outline"),
              button("Create an account", START, "brand"),
            ],
            {
              display: sv("flex"),
              flexDirection: [
                { value: "column" },
                { value: "row", breakpoint: ["sm"] },
              ],
              justifyContent: sv("center"),
              alignItems: sv("center"),
              flexWrap: sv("wrap"),
              gap: gap(0.75),
              width: size(100, "%"),
            },
          ),
        ],
        {
          alignItems: sv("center"),
          gap: gap(2),
        },
      ),
    ],
  });
}

function legalArticle(updated: string, sections: LegalSection[]) {
  return section([
    text(`Last updated ${updated}`, {
      color: sv(C.mutedFg),
      fontSize: sv({ value: 0.875, unit: "rem" }),
    }),
    ...sections.flatMap((s) => {
      const blocks = [
        heading("h2", s.title, { fontSize: sv({ value: 1.5, unit: "rem" }) }),
        texts(s.paragraphs, { color: sv(C.mutedFg) }),
      ];
      if (s.bullets?.length) {
        blocks.push(
          container(
            s.bullets.map((b) => bulletRow(b)),
            { gap: sv({ value: 0.4, unit: "rem" }) },
          ),
        );
      }
      return blocks;
    }),
  ]);
}

export function privacyPage() {
  return pageDoc({
    title: "Privacy Policy",
    slug: "privacy",
    description:
      "How Hacado collects, uses, and protects personal data for workspace owners and the clients they serve.",
    keywords: keywords("privacy", "gdpr"),
    children: [
      pageHero({
        eyebrow: "Legal",
        title: "Privacy Policy",
        body: "How Hacado collects, uses, and protects personal data for workspace owners and the clients they serve.",
      }),
      legalArticle(privacyUpdated, privacySections),
    ],
  });
}

export function termsPage() {
  return pageDoc({
    title: "Terms of Service",
    slug: "terms",
    description:
      "The agreement that governs your use of Hacado’s scheduling platform, websites, and billing.",
    keywords: keywords("terms", "legal"),
    children: [
      pageHero({
        eyebrow: "Legal",
        title: "Terms of Service",
        body: "The agreement that governs your use of Hacado’s scheduling platform, websites, and billing.",
      }),
      legalArticle(termsUpdated, termsSections),
    ],
  });
}

export function notFoundPage() {
  return pageDoc({
    title: "Page not found",
    slug: "404",
    description: "That URL is not a Hacado marketing page.",
    keywords: keywords("404"),
    children: [
      pageHero({
        title: "Page not found",
        body: "That URL is not on this site.",
        buttons: [button("Back to home", "/", "primary")],
      }),
      ctaBand("Back to the homepage", "Or start a free workspace."),
    ],
  });
}

export function revenueToolsRedirect() {
  return pageDoc({
    title: "Revenue tools",
    slug: "features/revenue-tools",
    description: "Moved to Gift cards.",
    keywords: keywords("gift cards"),
    children: [redirect("/features/gift-cards", true)],
  });
}


