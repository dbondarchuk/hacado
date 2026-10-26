/** Home page. */
import { buildEditorialHome, comparisonTable, pageDoc } from "../blocks";
import {
  audienceCards,
  competitorColumns,
  competitorRows,
  featuredFeatures,
  featureGroups,
  homeFaqs,
  integrations,
  plans,
  SIGNUP_URL,
  site,
  stepsHome,
  TEMPLATE_PREVIEWS_URL,
  testimonial,
} from "../content/site";
import { keywords } from "./shared";

const trustNames = [
  "Google Calendar",
  "Outlook",
  "Zoom",
  "Square",
  "Stripe",
  "PayPal",
];

const productLead = ["website-builder", "appointments", "scheduling"];

const productFeatures = [...featuredFeatures].sort((a, b) => {
  const rank = (slug: string) => {
    const index = productLead.indexOf(slug);
    return index === -1 ? productLead.length : index;
  };

  const byRank = rank(a.slug) - rank(b.slug);
  if (byRank !== 0) {
    return byRank;
  }

  return featuredFeatures.indexOf(a) - featuredFeatures.indexOf(b);
});

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
    integrations: trustNames.flatMap((name) =>
      integrations.some((item) => item.name === name) ? [name] : [],
    ),
    integrationsHref: "/integrations",
    audienceKicker: "04 / Built around you",
    audienceTitleLead: "Independent beauty",
    audienceTitleEm: "& wellness first.",
    audienceBody:
      "Nail, hair, tattoo, lash, and small studios that want their own branded booking website - not a marketplace listing. Coaches and client businesses are welcome too.",
    audiences: audienceCards.map((card) => ({
      href: card.href,
      title: card.title,
      body: card.caption,
    })),
    featuresKicker: "01 / Product",
    featuresTitleLead: "What Hacado",
    featuresTitleEm: "can do.",
    featuresBody: featureGroups.find((group) => group.id === "core")?.body,
    features: productFeatures.map((feature) => ({
      href: `/features/${feature.slug}`,
      kicker: feature.eyebrow,
      title: feature.title,
      body: feature.summary,
    })),
    templates: {
      kicker: "02 / Templates",
      titleLead: "Try the website",
      titleEm: "before you sign up.",
      body: "Open full demos for nails, hair, spas, and more. Click through pages the way your clients will - then start free with a look you like.",
      href: TEMPLATE_PREVIEWS_URL,
      cta: "Browse website templates",
      images: [
        {
          src: "/assets/templates/photography-home.png",
          alt: "Photography studio website template",
        },
        {
          src: "/assets/templates/salon-floor.png",
          alt: "Salon interior website template",
        },
        {
          src: "/assets/templates/tattoo-home.png",
          alt: "Tattoo studio website template",
        },
        {
          src: "/assets/templates/nails-home.png",
          alt: "Nail studio website template",
        },
        {
          src: "/assets/templates/salon-home.png",
          alt: "Hair studio website template",
        },
        {
          src: "/assets/templates/spa-home.png",
          alt: "Spa website template",
        },
        {
          src: "/assets/templates/nails-set.png",
          alt: "Nail appointment website template",
        },
      ],
    },
    stepsKicker: "03 / How it works",
    stepsTitleLead: "Live",
    stepsTitleEm: "in minutes.",
    steps: stepsHome,
    storiesKicker: "05 / Stories",
    storiesTitleLead: "What our",
    storiesTitleEm: "customers say.",
    testimonial,
    compareKicker: "06 / Compare",
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
    pricingKicker: "07 / Pricing",
    pricingTitleLead: "Start free.",
    pricingTitleEm: "Grow when the book fills.",
    plans: plans.map((plan) => ({
      ...plan,
      href: SIGNUP_URL,
    })),
    pricingDetailsHref: "/pricing",
    faqKicker: "08 / Questions",
    faqTitleLead: "Questions,",
    faqTitleEm: "answered.",
    faqs: homeFaqs,
    ctaKicker: "09 / Your next chapter",
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
