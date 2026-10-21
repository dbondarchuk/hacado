/** Home page. */
import {
  audienceCards,
  competitorColumns,
  competitorRows,
  featureGroups,
  featuredFeatures,
  homeFaqs,
  integrations,
  plans,
  SIGNUP_URL,
  site,
  stepsHome,
  TEMPLATE_PREVIEWS_URL,
  testimonial,
} from "../content/site";
import { buildEditorialHome, comparisonTable, pageDoc } from "../blocks";
import { keywords } from "./shared";

const trustNames = [
  "Google Calendar",
  "Outlook",
  "Zoom",
  "Square",
  "Stripe",
  "PayPal",
];

export function homePage() {
  const editorial = buildEditorialHome({
    banner: site.banner,
    eyebrow: "For independent beauty & wellness",
    eyebrowPhrases: [
      "independent studios",
      "nail artists",
      "hair stylists",
      "lash techs",
      "brow artists",
      "tattoo artists",
      "solo practitioners",
      "salon teams",
      "new businesses",
      "wellness pros",
    ],
    titleLead: "Your booking site,",
    titleEm: "fully booked.",
    body: site.heroBody,
    note: site.heroNote,
    industries: site.typewriter,
    signupUrl: SIGNUP_URL,
    heroImage: "/assets/photos/salon-owner-hero.png",
    integrations: trustNames.flatMap((name) =>
      integrations.some((item) => item.name === name) ? [name] : [],
    ),
    integrationsHref: "/integrations",
    productKicker: "01 / Everything in one place",
    productTitleLead: "Your booking website,",
    productTitleEm: "beautifully built.",
    productBody:
      "Every business on Hacado gets a hosted, white-label site - your brand, ready in minutes. We also help ChatGPT and Google understand who you are: a clear summary for AI assistants, and structured details for search - no developer, no copy-paste.",
    productHref: "/features",
    cards: [
      {
        n: "01",
        tone: "dark",
        title: ["One calm place", "to run it all."],
        body: "Your site, calendar, and payments stay in one admin. Clients book while you work.",
        href: "/features",
        link: "Explore features",
      },
      {
        n: "02",
        tone: "tan",
        title: ["More than a", "calendar link."],
        body: "Gift cards, deposits, reminders, and packages — on your brand, not a marketplace listing.",
        href: "/features/gift-cards",
        link: "See what's included",
      },
    ],
    stat: {
      value: "0%",
      label: ["marketplace", "commission"],
      href: "/compare",
    },
    audienceKicker: "02 / Built around you",
    audienceTitleLead: "Independent beauty",
    audienceTitleEm: "& wellness first.",
    audienceBody:
      "Nail, hair, tattoo, lash, and small studios that want their own branded booking website - not a marketplace listing. Coaches and client businesses are welcome too.",
    audiences: audienceCards.map((card) => ({
      href: card.href,
      title: card.title,
      body: card.caption,
    })),
    featuresKicker: "Product",
    featuresTitleLead: "What the book",
    featuresTitleEm: "can do.",
    featuresBody: featureGroups.find((group) => group.id === "core")?.body,
    features: featuredFeatures.map((feature) => ({
      href: `/features/${feature.slug}`,
      title: feature.title,
      body: feature.summary,
    })),
    templates: {
      kicker: "Templates",
      titleLead: "Try the website",
      titleEm: "before you sign up.",
      body: "Open full demos for nails, hair, lashes, spas, coaches, and more. Click through pages the way your clients will - then start free with a look you like.",
      href: TEMPLATE_PREVIEWS_URL,
      cta: "Browse website templates",
      images: [
        {
          src: "/assets/templates/nails-home.png",
          alt: "Nail studio website template",
        },
        {
          src: "/assets/templates/lash-home.png",
          alt: "Lash studio website template",
        },
        {
          src: "/assets/templates/salon-home.png",
          alt: "Salon website template",
        },
      ],
    },
    stepsKicker: "How it works",
    stepsTitleLead: "Live",
    stepsTitleEm: "in minutes.",
    steps: stepsHome,
    storiesKicker: "Stories",
    storiesTitleLead: "What our",
    storiesTitleEm: "customers say.",
    testimonial,
    compareKicker: "Compare",
    compareTitleLead: "Keep your clients.",
    compareTitleEm: "Skip the marketplace.",
    compareBody:
      "Leaving Fresha, Booksy, or Vagaro? Or stuck on a Square booking page / Calendly link? Read the opinionated side-by-sides.",
    compareHref: "/compare",
    compareTable: comparisonTable({
      cornerHeader: "Capability",
      columns: [...competitorColumns],
      rows: competitorRows,
      highlightCol: 0,
      checkmarks: true,
    }),
    pricingKicker: "Pricing",
    pricingTitleLead: "Start free.",
    pricingTitleEm: "Grow when the book fills.",
    plans: plans.map((plan) => ({
      ...plan,
      href: SIGNUP_URL,
    })),
    pricingDetailsHref: "/pricing",
    faqTitleLead: "Questions,",
    faqTitleEm: "answered.",
    faqs: homeFaqs,
    ctaKicker: "03 / Your next chapter",
    ctaTitleLead: "Ready to run bookings",
    ctaTitleEm: "on your own site?",
    ctaBody:
      "Create an account, pick your plan, and go live. Cancel anytime from billing settings.",
    ctaLabel: "Start for free",
  });

  return pageDoc({
    title: "Home",
    slug: "home",
    description: `${site.tagline} ${site.heroBody}`,
    keywords: keywords("scheduling software", "booking website"),
    children: [...editorial.before, ...editorial.after],
  });
}
