/** Home page. */
import {
  audienceCards,
  browserSlides,
  competitorColumns,
  competitorRows,
  featuredFeatures,
  homeFaqs,
  integrations,
  plans,
  site,
  stepsHome,
  testimonial,
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
import { HERO_HEADER_NAME, keywords } from "./shared";

export function homePage() {
  return pageDoc({
    title: "Home",
    slug: "home",
    description: `${site.tagline} ${site.heroBody}`,
    keywords: keywords("scheduling software", "booking website"),
    children: [
      banner(site.banner),
      homeHero({
        eyebrow: site.heroEyebrow,
        titleBefore: site.heroTitleBefore,
        phrases: site.typewriter,
        body: site.heroBody,
        note: site.heroNote,
        slides: browserSlides,
      }),
      scrollingLogos(
        integrations,
        "Works with Google Calendar, Outlook, CalDAV, ICS import, Zoom, and payments",
      ),
      section([
        sectionIntro({
          eyebrow: "Who it’s for",
          title: "Independent beauty & wellness first",
          body: "Nail, hair, tattoo, lash, and small studios that want their own branded booking website - not a marketplace listing. Coaches and client businesses are welcome too.",
        }),
        grid(
          audienceCards.map((c) =>
            cardLink({
              href: c.href,
              title: c.title,
              body: c.caption,
              image: c.image,
            }),
          ),
          "repeat(2, minmax(0, 1fr))",
          {
            gridTemplateColumns: [
              { value: "1fr" },
              { value: "repeat(2, minmax(0, 1fr))", breakpoint: ["sm"] },
              { value: "repeat(4, minmax(0, 1fr))", breakpoint: ["lg"] },
            ],
          },
        ),
      ]),
      section([
        grid(
          [
            statCell("24/7", "Clients book while you work"),
            statCell("One", "Site, calendar, and payments"),
            statCell("0%", "Marketplace commission"),
          ],
          "repeat(3, minmax(0, 1fr))",
        ),
      ]),
      section([
        sectionIntro({
          eyebrow: "Product",
          title: "Your booking website, beautifully built",
          body: "Every business on Hacado gets a hosted, white-label site - your brand, ready in minutes. We also help ChatGPT and Google understand who you are: a clear summary for AI assistants, and structured details for search - no developer, no copy-paste.",
        }),
        featuresShowcase(featuredFeatures.map(marketingFeatureItem)),
        container(
          [
            link("All features →", "/features", {
              color: sv(C.primary),
              fontWeight: sv("600"),
            }),
          ],
          { alignItems: sv("center") },
        ),
      ]),
      templatesBrowseSection({
        emphasis: "band",
        title: "Try the website templates before you sign up",
        body: "Open full demos for nails, hair, lashes, spas, coaches, and more. Click through pages the way your clients will - then start free with a look you like.",
      }),
      // TODO: re-enable home product videos when ready
      // videoSection({
      //   src: marketingVideos.laptopUi,
      //   eyebrow: "See it",
      //   title: "A site clients open from Instagram",
      //   body: "Your brand on every page - services, gallery, and a book that takes deposits. Built so people - and ChatGPT - can tell what you offer.",
      // }),
      // videoSection({
      //   src: marketingVideos.laptopCloseup,
      //   eyebrow: "In the admin",
      //   title: "Run the book from one calm dashboard",
      //   body: "Appointments, clients, payments, and the public site stay in the same login you open every morning.",
      // }),
      // videoSection({
      //   src: marketingVideos.phoneApp,
      //   eyebrow: "On the phone",
      //   title: "Booking that fits in a pocket",
      //   body: "Clients pick a time, leave a deposit, and get reminders - without another marketplace app.",
      // }),
      section([
        sectionIntro({ eyebrow: "How it works", title: "Live in minutes" }),
        grid(
          stepsHome.map((s) => step(s.n, s.title, s.body)),
          "repeat(3, minmax(0, 1fr))",
        ),
      ]),
      section([
        sectionIntro({
          eyebrow: "Testimonials",
          title: "What our customers say",
        }),
        testimonialCard(testimonial),
      ]),
      section([
        sectionIntro({
          eyebrow: "Compare",
          title: "Keep your clients. Skip the marketplace.",
          body: "Leaving Fresha, Booksy, or Vagaro? Or stuck on a Square booking page / Calendly link? Read the opinionated side-by-sides.",
        }),
        comparisonTable({
          cornerHeader: "Capability",
          columns: [...competitorColumns],
          rows: competitorRows,
          highlightCol: 0,
          checkmarks: true,
        }),
        container(
          [
            link("Full comparison →", "/compare", {
              color: sv(C.primary),
              fontWeight: sv("600"),
            }),
          ],
          { alignItems: sv("center") },
        ),
      ]),
      section([
        sectionIntro({
          eyebrow: "Pricing",
          title: "Start free. Grow when the book fills.",
        }),
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
        container(
          [
            link("See details", "/pricing", {
              color: sv(C.primary),
              fontWeight: sv("600"),
            }),
          ],
          { alignItems: sv("center") },
        ),
      ]),
      section([sectionIntro({ title: "Questions" }), accordion(homeFaqs)]),
      ctaBand(
        "Ready to run bookings on your own site?",
        "Create an account, pick your plan, and go live. Cancel anytime from billing settings.",
      ),
    ],
  });
}


