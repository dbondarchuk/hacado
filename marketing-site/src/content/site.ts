export const ADMIN_URL = "https://app.hacado.com";
export const DOCS_URL = "https://docs.hacado.com";
export const SIGNUP_URL = `${ADMIN_URL}/auth/signup`;
export const SIGNIN_URL = `${ADMIN_URL}/auth/signin`;
export const TEMPLATE_PREVIEWS_URL = `${ADMIN_URL}/template-previews`;
export const SUPPORT_EMAIL = "support@hacado.com";
export const PRIVACY_EMAIL = "privacy@hacado.com";
export const LEGAL_EMAIL = "legal@hacado.com";
export const GITHUB_ISSUES_URL =
  "https://github.com/dbondarchuk/hacado/issues/new";

export const site = {
  name: "Hacado",
  tagline:
    "Hacado gives independent beauty & wellness businesses a beautiful booking website without the ugly software.",
  heroEyebrow: "Your booking website. Your brand. Your clients.",
  heroTitleBefore: "A beautiful booking website for",
  typewriter: ["nails", "hair", "lashes", "tattoo", "wellness"],
  heroBody:
    "Stop stitching a marketplace listing to a calendar link. Hacado is a branded booking website, calendar, deposits, reminders, and gift cards in one admin - built for independent beauty and wellness studios that want to own the client, not rent them.",
  heroNote: "Free plan available · No marketplace · Cancel anytime",
  banner:
    "Independent beauty & wellness: a beautiful booking website without the ugly software.",
};

export type NavChild = { label: string; href: string };
export type NavItem = { label: string; href: string; children?: NavChild[] };

export const nav: NavItem[] = [
  {
    label: "Features",
    href: "/features",
    children: [
      { label: "Scheduling", href: "/features/scheduling" },
      { label: "Appointment management", href: "/features/appointments" },
      { label: "Activity events", href: "/features/activity" },
      { label: "Website builder", href: "/features/website-builder" },
      { label: "Website templates", href: TEMPLATE_PREVIEWS_URL },
      { label: "Booking tracking", href: "/features/booking-tracking" },
      { label: "Payments", href: "/features/payments" },
      { label: "Notifications", href: "/features/notifications" },
      { label: "Calendars & video", href: "/features/calendars-video" },
      { label: "Gift cards", href: "/features/gift-cards" },
      { label: "Discounts", href: "/features/discounts" },
      { label: "Packages", href: "/features/packages" },
      { label: "Add-ons", href: "/features/add-ons" },
      { label: "Staff management", href: "/features/team" },
      { label: "Client management", href: "/features/clients" },
    ],
  },
  {
    label: "Use cases",
    href: "/use-cases",
    children: [
      { label: "Nail artists", href: "/use-cases/nail-artists" },
      { label: "Hair & barbers", href: "/use-cases/hair-stylists" },
      { label: "Tattoo artists", href: "/use-cases/tattoo-artists" },
      { label: "Lash & brow", href: "/use-cases/lash-and-brow" },
      { label: "Salons & clinics", href: "/use-cases/salons-clinics" },
      { label: "Coaches", href: "/use-cases/coaches" },
      { label: "Consultants", href: "/use-cases/consultants" },
      { label: "Personal trainers", href: "/use-cases/personal-trainers" },
      { label: "Photographers", href: "/use-cases/photographers" },
      { label: "Therapists", href: "/use-cases/therapists" },
      { label: "Tutors", href: "/use-cases/tutors-freelancers" },
      { label: "Freelancers", href: "/use-cases/freelancers" },
      { label: "New businesses", href: "/use-cases/new-businesses" },
    ],
  },
  {
    label: "Compare",
    href: "/compare",
    children: [
      { label: "All alternatives", href: "/compare" },
      { label: "Fresha alternative", href: "/compare/fresha" },
      { label: "Booksy alternative", href: "/compare/booksy" },
      { label: "GlossGenius alternative", href: "/compare/glossgenius" },
      { label: "Boulevard alternative", href: "/compare/boulevard" },
      { label: "StyleSeat alternative", href: "/compare/styleseat" },
      { label: "Vagaro alternative", href: "/compare/vagaro" },
      { label: "Mindbody alternative", href: "/compare/mindbody" },
      { label: "Goldie alternative", href: "/compare/goldie" },
      { label: "Squire alternative", href: "/compare/squire" },
      { label: "Calendly alternative", href: "/compare/calendly" },
      { label: "Acuity alternative", href: "/compare/acuity" },
      { label: "Square alternative", href: "/compare/square-appointments" },
    ],
  },
  { label: "Pricing", href: "/pricing" },
  { label: "Integrations", href: "/integrations" },
];

export const audienceCards = [
  {
    href: "/use-cases/nail-artists",
    title: "Studios & chairs",
    image: "/assets/photos/nails-closeup.jpg",
    caption: "Nails, hair, tattoo, lash - deposits and fills",
  },
  {
    href: "/use-cases/coaches",
    title: "Coaches & consultants",
    image: "/assets/photos/coach-laptop.jpg",
    caption: "Video, a real site, session packages",
  },
  {
    href: "/use-cases/salons-clinics",
    title: "Teams & clinics",
    image: "/assets/generated/usecase-salon.png",
    caption: "Several calendars, one brand",
  },
  {
    href: "/use-cases/new-businesses",
    title: "Starting from zero",
    image: "/assets/generated/usecase-newbiz.png",
    caption: "A live book without a vendor stack",
  },
];

export const aboutAudiences = [
  {
    href: "/use-cases/nail-artists",
    title: "Independent practitioners",
    body: "One person, a book, and a site that looks like the work - nails, hair, tattoo, lash, wellness, or a practice that does not have a front desk.",
  },
  {
    href: "/use-cases/salons-clinics",
    title: "Studios, salons, and clinics",
    body: "Several people, several hours, one public brand. Clients pick a favorite or the next opening. The list stays in the workspace.",
  },
  {
    href: "/use-cases/coaches",
    title: "Coaches and consultants",
    body: "Calendly is for meetings. Hacado is for businesses: pages, deposits, Zoom or Meet, and packages on your domain.",
  },
  {
    href: "/use-cases/tutors-freelancers",
    title: "Tutors and freelancers",
    body: "Lesson types, a page parents can bookmark, calendar sync with a day job, prepaid packs when invoicing gets old.",
  },
  {
    href: "/features/team",
    title: "Small teams",
    body: "Studio seats, roles, and a calendar per person - without buying a marketplace or a 40-feature salon suite on week one.",
  },
  {
    href: "/use-cases/new-businesses",
    title: "Anyone opening a book from zero",
    body: "Hosting, scheduling, and email in one admin. Payments, gift cards, and extra people when the calendar actually fills.",
  },
];

export const browserSlides = [
  {
    id: "booking",
    label: "Booking site",
    src: "/assets/generated/mock-booking-site.png",
    address: "vivid.hacado.me",
  },
  {
    id: "calendar",
    label: "Calendar",
    src: "/assets/generated/mock-admin-calendar.png",
    address: "app.hacado.com/calendar",
  },
  {
    id: "gifts",
    label: "Gift cards",
    src: "/assets/generated/mock-gift-checkout.png",
    address: "vivid.hacado.me/gift-cards",
  },
];

export {
  featureBySlug,
  featureGroups,
  featuredFeatures,
  features,
} from "./features";
export type { Feature, FeatureGroupId, FeatureIcon } from "./features";
export { integrationGroups, integrations } from "./integrations";
export type { IntegrationGroup, IntegrationItem } from "./integrations";
export { useCaseBySlug, useCases } from "./useCases";
export type { UseCase } from "./useCases";

export const stepsHome = [
  {
    n: "01",
    title: "Tell us about your business",
    body: "A few questions about what you do and when you are available. Takes about two minutes.",
  },
  {
    n: "02",
    title: "Make it yours",
    body: "Choose colors, add your logo, write a welcome message. Drag and drop to build the page.",
  },
  {
    n: "03",
    title: "Connect your tools",
    body: "Google, Outlook, CalDAV, or an ICS busy-time feed. Optional SMS, payments, and video links.",
  },
];

export const testimonial = {
  quote:
    "I used to lose Saturday slots to DMs that never paid. Now clients book the gel set, leave a deposit, and I get a reminder the night before - same as they do.",
  name: "Olesia Bondarchuk",
  role: "Nail artist, VIVID Nail Studio",
  image: "/assets/logos/vivid.png",
  url: "https://vividnail.studio",
};

export type Plan = {
  slug: "free" | "solo" | "studio";
  name: string;
  subtitle: string;
  price: string;
  priceYearly?: string;
  period: string;
  footnote: string;
  badge?: string;
  cta: string;
  featured?: boolean;
  benefits: string[];
  includes?: string;
};

export const plans: Plan[] = [
  {
    slug: "free",
    name: "Free",
    subtitle: "Get started at no cost",
    price: "$0",
    period: "/ month",
    footnote: "No card required to try",
    cta: "Start with Free",
    benefits: [
      "Up to 15 appointments per billing cycle",
      "1 bookable service",
      "Up to 10 pages",
      "Custom booking page with your branding",
      "Calendar sync (Google, Outlook, CalDAV, ICS import)",
      "Email notifications",
      "Confirm, reschedule, decline, and no-show",
      "30 days of activity history. Payments and permissions never expire",
      "SMS credits purchased separately",
      "Free yourbusiness.hacado.me address",
    ],
  },
  {
    slug: "solo",
    name: "Solo",
    subtitle: "Everything you need to scale",
    price: "$29",
    priceYearly: "$348",
    period: "/ month",
    footnote: "Billed monthly. Cancel anytime.",
    badge: "Recommended",
    cta: "Subscribe to Solo",
    featured: true,
    includes: "Everything in Free, plus:",
    benefits: [
      "Accept payments - Square, Stripe, PayPal",
      "Payment links by email, SMS, or QR",
      "Sync in-store card payments",
      "Your own domain",
      "Unlimited bookings, services, and clients",
      "Gift cards, discounts & promotions",
      "Prepaid appointment packages",
      "Waitlist that offers opened slots, intake forms, blog",
      "Booking funnel tracking",
      "Google Analytics 4 (page views + conversions)",
      "Client self-service portal",
      "100 SMS credits every month",
      "90 days of activity history (instead of 30)",
    ],
  },
  {
    slug: "studio",
    name: "Studio",
    subtitle: "For businesses with multiple employees",
    price: "$59",
    priceYearly: "$708",
    period: "/ month",
    footnote: "Billed monthly. Extra seats from $4/month.",
    badge: "Good for business",
    cta: "Subscribe to Studio",
    includes: "Everything in Solo, plus:",
    benefits: [
      "5 team members included",
      "Additional seats from $4/month each",
      "Individual calendars per team member",
      "300 SMS credits every month",
      "365 days of activity history (instead of 90)",
    ],
  },
];

export const planComparisonRows: {
  feature: string;
  free: string;
  solo: string;
  studio: string;
}[] = [
  { feature: "Price", free: "$0", solo: "$29 / month", studio: "$59 / month" },
  {
    feature: "Appointments / cycle",
    free: "15",
    solo: "Unlimited",
    studio: "Unlimited",
  },
  { feature: "Services", free: "1", solo: "Unlimited", studio: "Unlimited" },
  { feature: "Pages", free: "10", solo: "Unlimited", studio: "Unlimited" },
  { feature: "Website builder", free: "Yes", solo: "Yes", studio: "Yes" },
  {
    feature: "Staff appointment actions",
    free: "Yes",
    solo: "Yes",
    studio: "Yes",
  },
  {
    feature: "Client self-service",
    free: "-",
    solo: "Yes",
    studio: "Yes",
  },
  { feature: "Custom domain", free: "-", solo: "Yes", studio: "Yes" },
  { feature: "Payments", free: "-", solo: "Yes", studio: "Yes" },
  { feature: "Gift cards & discounts", free: "-", solo: "Yes", studio: "Yes" },
  { feature: "Packages", free: "-", solo: "Yes", studio: "Yes" },
  { feature: "Waitlist & forms", free: "-", solo: "Yes", studio: "Yes" },
  { feature: "Booking tracking", free: "-", solo: "Yes", studio: "Yes" },
  { feature: "Google Analytics 4", free: "-", solo: "Yes", studio: "Yes" },
  {
    feature: "Activity history",
    free: "30 days",
    solo: "90 days",
    studio: "365 days",
  },
  { feature: "Team seats", free: "1", solo: "1", studio: "5 + extras" },
  {
    feature: "SMS credits / month",
    free: "Buy extra",
    solo: "100",
    studio: "300",
  },
];

export type Cell = "yes" | "no" | "partial" | string;

export const competitorColumns = [
  "Hacado",
  "Calendly",
  "Acuity",
  "Square Appointments",
  "Booksy",
  "Fresha",
  "Vagaro",
] as const;

export const competitorRows: { feature: string; cells: Cell[] }[] = [
  {
    feature: "Independent branded website",
    cells: ["yes", "no", "partial", "no", "no", "no", "no"],
  },
  {
    feature: "Your own domain",
    cells: ["yes", "partial", "partial", "partial", "no", "no", "partial"],
  },
  {
    feature: "Marketplace / directory",
    cells: ["no", "no", "no", "no", "yes", "yes", "yes"],
  },
  {
    feature: "You own the client list",
    cells: ["yes", "yes", "yes", "yes", "partial", "partial", "partial"],
  },
  {
    feature: "Stripe + Square + PayPal",
    cells: ["yes", "partial", "yes", "no", "partial", "partial", "partial"],
  },
  {
    feature: "Online payments",
    cells: ["yes", "partial", "yes", "yes", "yes", "yes", "yes"],
  },
  {
    feature: "SMS reminders",
    cells: ["yes", "partial", "yes", "yes", "yes", "yes", "yes"],
  },
  {
    feature: "Gift cards",
    cells: ["yes", "no", "yes", "yes", "yes", "yes", "yes"],
  },
  {
    feature: "Waitlist",
    cells: ["yes", "no", "yes", "yes", "yes", "yes", "yes"],
  },
  {
    feature: "Multi-staff calendars",
    cells: ["yes", "partial", "yes", "yes", "yes", "yes", "yes"],
  },
];

export const otherTools = [
  {
    name: "Mangomint",
    blurb:
      "Spa and clinic ops suite. Heavier than a solo beauty booking website.",
  },
  {
    name: "Setmore",
    blurb:
      "Budget scheduler for small teams. Limited website - mostly a booking page.",
  },
  {
    name: "SimplyBook.me",
    blurb: "Plugin-heavy booking. Powerful, more setup than Hacado’s builder.",
  },
  {
    name: "Squarespace Scheduling",
    blurb:
      "Scheduler bolted onto a website product. Fine if you already live in Squarespace.",
  },
  {
    name: "Phorest / Zenoti / Timely",
    blurb:
      "Larger salon suites. Choose them when you need retail, memberships, and enterprise ops - not only a branded book.",
  },
];

export type ComparePage = {
  slug: string;
  competitor: string;
  /** Short label for nav / cards, e.g. "Calendly alternative" */
  navLabel: string;
  /** Browser / SERP title. Used as-is (not combined with brand). */
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  /** Visible H1 */
  heroTitle: string;
  heroEyebrow: string;
  /** Extra on-page intro under the hero points */
  lede: string;
  image: string;
  /** Extra paths that 301 to /compare/{slug} */
  alternativeSlugs: string[];
  points: {
    title: string;
    /** Hacado column heading; defaults to title */
    hacadoTitle?: string;
    /** Competitor column heading; defaults to title */
    otherTitle?: string;
    hacado: string;
    other: string;
  }[];
  faqs: { q: string; a: string }[];
  cta?: { title: string; body: string };
  related?: { label: string; href: string }[];
};

export const compareHub = {
  seoTitle: "Fresha, Booksy, GlossGenius & Calendly Alternatives | Hacado",
  seoDescription:
    "Leaving a marketplace or a meeting link? Hacado is a branded booking website for independent beauty & wellness - your clients, your brand, no directory.",
  keywords: [
    "fresha alternative",
    "booksy alternative",
    "glossgenius alternative",
    "boulevard alternative",
    "styleseat alternative",
    "vagaro alternative",
    "mindbody alternative",
    "calendly alternative",
    "square appointments alternative",
    "acuity alternative",
    "hacado vs fresha",
  ],
  heroEyebrow: "Compare alternatives",
  heroTitle: "Keep your bookings. Keep your clients. Keep your brand.",
  heroBody:
    "Marketplaces rent you demand and share your customers. Meeting tools give you a link, not a business. Hacado is the opposite: an independent booking website for beauty and wellness studios that already have Instagram, Google, and word of mouth.",
};

export const comparePages: ComparePage[] = [
  {
    slug: "fresha",
    competitor: "Fresha",
    navLabel: "Fresha alternative",
    seoTitle: "Fresha Alternative Without a Marketplace | Hacado",
    seoDescription:
      "Leaving Fresha? Keep your bookings, clients, and brand. Hacado is a branded booking website for independent beauty businesses - not a marketplace that shares your customers.",
    keywords: [
      "fresha alternative",
      "best fresha alternative",
      "fresha alternative without marketplace",
      "hacado vs fresha",
      "leave fresha",
    ],
    heroEyebrow: "Fresha alternative",
    heroTitle:
      "Leaving Fresha? Keep your bookings. Keep your clients. Keep your brand.",
    lede: "Hacado gives independent beauty businesses their own branded booking website without putting them inside a marketplace. That matters because marketplaces are a huge part of Fresha’s pitch - discovery that also puts “similar nearby” next to you. Hacado’s philosophy is the opposite: your clients belong to you.",
    image: "/assets/generated/usecase-nails.png",
    alternativeSlugs: [
      "fresha-alternative",
      "alternatives/fresha",
      "best-fresha-alternative",
    ],
    points: [
      {
        title: "Website",
        hacado:
          "A full branded site: services, gallery, FAQ, gift cards, your domain.",
        other:
          "An app listing and booking flow under Fresha’s brand - not an independent website you own.",
      },
      {
        title: "Marketplace",
        hacado:
          "None. Instagram, Google, and word of mouth bring demand. We run the book.",
        other:
          "Marketplace discovery is the product. New clients arrive beside competitors Fresha also lists.",
      },
      {
        title: "Who owns the client",
        hacado: "Your workspace. Your list. Your brand on every reminder.",
        other:
          "The next booking lives inside the marketplace dynamic. Clients remember the app as much as you.",
      },
      {
        title: "What you pay for",
        hacado: "A plan. No client-directory commission.",
        other: "Platform economics tied to marketplace volume and processing.",
      },
      {
        title: "Best fit",
        hacadoTitle: "When Hacado wins",
        otherTitle: "When Fresha still wins",
        hacado:
          "You already fill the book from Instagram and want the site to match the work.",
        other:
          "You need the app-store faucet for demand and have no audience of your own yet.",
      },
    ],
    faqs: [
      {
        q: "Is Hacado a Fresha alternative without a marketplace?",
        a: "Yes. That is the point. Hacado does not list you in a directory or send the next client to a shop down the street.",
      },
      {
        q: "Will I lose clients if I leave Fresha?",
        a: "You keep the relationships you already have - move them to your own URL. New marketplace discovery stops; that is the trade for owning the brand.",
      },
      {
        q: "Do I get a real website?",
        a: "Yes. Multi-page builder, custom domain on Solo, gift cards and booking on the same brand - not only a listing page.",
      },
    ],
    cta: {
      title: "Keep your bookings. Keep your clients. Keep your brand.",
      body: "Start free. Publish your site. Send the new URL - not another marketplace profile.",
    },
  },
  {
    slug: "booksy",
    competitor: "Booksy",
    navLabel: "Booksy alternative",
    seoTitle: "Booksy Alternative: Own Your Clients | Hacado",
    seoDescription:
      "Leaving Booksy? Hacado is a branded booking website without a marketplace sharing your customers. Your page, your list, your brand.",
    keywords: [
      "booksy alternative",
      "best booksy alternative",
      "booksy alternative for salons",
      "hacado vs booksy",
      "leave booksy",
    ],
    heroEyebrow: "Booksy alternative",
    heroTitle:
      "Leaving Booksy? Keep your bookings. Keep your clients. Keep your brand.",
    lede: "Booksy’s pitch is discovery inside an app marketplace. That also means shared customers, Booksy-branded booking, and competitors one tap away. Hacado is for studios that already get demand from Instagram and Google and want an independent website - not another listing that rents the relationship.",
    image: "/assets/photos/nails-studio.jpg",
    alternativeSlugs: [
      "booksy-alternative",
      "alternatives/booksy",
      "best-booksy-alternative",
    ],
    points: [
      {
        title: "Independent website",
        hacado:
          "White-label pages, gallery, policies, gift cards, your domain.",
        other:
          "Marketplace profile and in-app book flow. Clients see Booksy as much as they see you.",
      },
      {
        title: "Marketplace",
        hacado: "Zero directory. You bring the demand; we convert it.",
        other:
          "App-store discovery is the growth engine - and the reason your next client might book the chair next door.",
      },
      {
        title: "Client ownership",
        hacado: "The list lives in your workspace. Reminders go out as you.",
        other:
          "Bookings and rebooks sit inside the marketplace habit. Switching means breaking that habit on purpose.",
      },
      {
        title: "Commission vs plan",
        hacado: "Subscription. No client-directory cut.",
        other: "Economics tied to marketplace volume.",
      },
      {
        title: "Best fit",
        hacadoTitle: "When Hacado wins",
        otherTitle: "When Booksy still wins",
        hacado: "You already fill Saturdays from your own audience.",
        other: "The Booksy app is still your primary source of new clients.",
      },
    ],
    faqs: [
      {
        q: "Is Hacado a good Booksy alternative?",
        a: "Yes if you want to own the page and the list. No if you still depend on Booksy’s marketplace for most new bookings.",
      },
      {
        q: "Does Hacado take a marketplace commission?",
        a: "No. There is no client directory. You pay a plan.",
      },
      {
        q: "Can I switch from Booksy to Hacado?",
        a: "Publish your Hacado site, move services and hours, then send your own URL instead of the marketplace listing.",
      },
    ],
    cta: {
      title: "Your clients belong to you",
      body: "Leave the directory. Open a branded book on Hacado.",
    },
  },
  {
    slug: "vagaro",
    competitor: "Vagaro",
    navLabel: "Vagaro alternative",
    seoTitle: "Vagaro Alternative Without Marketplace Bloat | Hacado",
    seoDescription:
      "Leaving Vagaro? Hacado is a lighter branded booking website for independent studios - your clients, your site, no marketplace sharing the demand.",
    keywords: [
      "vagaro alternative",
      "best vagaro alternative",
      "vagaro alternative for salons",
      "hacado vs vagaro",
      "leave vagaro",
    ],
    heroEyebrow: "Vagaro alternative",
    heroTitle:
      "Leaving Vagaro? Keep your bookings. Keep your clients. Keep your brand.",
    lede: "Vagaro is a heavy salon suite with marketplace discovery. Independent nail, hair, and lash businesses often want something simpler: a beautiful booking website that is theirs - not a directory that shares customers and a product surface that feels like enterprise software. Hacado is that site.",
    image: "/assets/generated/usecase-salon.png",
    alternativeSlugs: [
      "vagaro-alternative",
      "alternatives/vagaro",
      "best-vagaro-alternative",
      "leave-vagaro",
    ],
    points: [
      {
        title: "Product weight",
        hacado:
          "Booking website + calendar + payments. Built to look like a studio, not a suite.",
        other:
          "Salon-suite breadth. Powerful - and heavier than a solo chair needs on day one.",
      },
      {
        title: "Independent website",
        hacado:
          "Your brand, pages, and domain. Clients never land in a directory.",
        other:
          "Marketplace discovery sits next to the ops tools. The brand clients remember is split.",
      },
      {
        title: "Shared demand",
        hacado:
          "No “similar nearby.” Your Instagram and Google stay the funnel.",
        other: "Marketplace pitch means shared inventory of attention.",
      },
      {
        title: "Client list",
        hacado: "Workspace-owned. Export and privacy are yours.",
        other: "Tied to the platform’s growth channels as much as your own.",
      },
      {
        title: "Best fit",
        hacadoTitle: "When Hacado wins",
        otherTitle: "When Vagaro still wins",
        hacado: "You want a light branded site and already have demand.",
        other:
          "You need the full suite (memberships, retail, payroll-class ops) in one vendor.",
      },
    ],
    faqs: [
      {
        q: "Is Hacado a lighter Vagaro alternative?",
        a: "Yes for independent studios that want a branded booking website without marketplace discovery and suite complexity.",
      },
      {
        q: "Do you have a marketplace like Vagaro?",
        a: "No. That is intentional. Your clients belong to you.",
      },
      {
        q: "Can a multi-chair salon use Hacado?",
        a: "Studio adds seats and per-person calendars. Still no directory.",
      },
    ],
    cta: {
      title: "A studio site - not a suite marketplace",
      body: "Start free. Upgrade when deposits and a domain matter.",
    },
  },
  {
    slug: "square-appointments",
    competitor: "Square Appointments",
    navLabel: "Square alternative",
    seoTitle: "Square Appointments Alternative | Real Website, Any Processor",
    seoDescription:
      "Square Appointments is a thin booking page locked to Square. Hacado is a multi-page booking website that still connects Square - and Stripe and PayPal.",
    keywords: [
      "square appointments alternative",
      "square booking alternative",
      "square scheduling alternative",
      "hacado vs square appointments",
      "leave square appointments",
    ],
    heroEyebrow: "Square Appointments alternative",
    heroTitle: "A real booking website without locking every dollar to Square",
    lede: "Square Appointments is fine if you already live inside Square POS. What it is not: a multi-page studio website you can grow. And the book is married to Square payments. Hacado gives you a branded site - and you can still take Square, or Stripe, or PayPal.",
    image: "/assets/generated/mock-gift-checkout.png",
    alternativeSlugs: [
      "square-appointments-alternative",
      "square-alternative",
      "alternatives/square-appointments",
    ],
    points: [
      {
        title: "Website depth",
        hacado:
          "Multi-page builder: about, gallery, FAQ, gift cards, policies, your domain.",
        other:
          "A booking page - a thin marketing surface, not a site you grow into.",
      },
      {
        title: "Payment lock-in",
        hacado:
          "Square, Stripe, or PayPal. The book is not married to one processor.",
        other: "Square-native. The appointment stack assumes Square money.",
      },
      {
        title: "Brand",
        hacado: "Clients see you, not a processor’s appointment skin.",
        other: "Feels like Square Appointments first, your studio second.",
      },
      {
        title: "Best fit",
        hacadoTitle: "When Hacado wins",
        otherTitle: "When Square still wins",
        hacado: "You want the site and a choice of processors.",
        other:
          "Hardware POS, payroll, and retail already run the business on Square end-to-end.",
      },
    ],
    faqs: [
      {
        q: "Can I still take Square payments on Hacado?",
        a: "Yes. Connect Square - or Stripe or PayPal. You are not locked to one.",
      },
      {
        q: "Is Hacado’s website more than Square’s booking page?",
        a: "Yes. Full pages and custom domain on Solo - not only a scheduler skin.",
      },
      {
        q: "When should I stay on Square Appointments?",
        a: "If POS hardware and payroll are the center of the business and a thin booking page is enough.",
      },
    ],
    cta: {
      title: "Website first. Processor optional.",
      body: "Publish the site. Connect the money you already trust.",
    },
  },
  {
    slug: "calendly",
    competitor: "Calendly",
    navLabel: "Calendly alternative",
    seoTitle: "Calendly Alternative for Businesses | Hacado",
    seoDescription:
      "Calendly is for meetings. Hacado is for businesses. Booking website, deposits, gift cards, packages, SMS, waitlist, and staff - for coaches, consultants, and client work.",
    keywords: [
      "calendly alternative",
      "best calendly alternative",
      "calendly alternative for small business",
      "hacado vs calendly",
      "calendly for coaches alternative",
    ],
    heroEyebrow: "Calendly alternative",
    heroTitle: "Calendly is for meetings. Hacado is for businesses.",
    lede: "Calendly is excellent at round-robin meeting links. If you sell packages, take deposits, text reminders, run a waitlist, or need a real website with your domain - you already outgrew a scheduler. Hacado is the booking business stack: payments, forms, gift cards, cabinet, SMS, staff, and pages.",
    image: "/assets/generated/usecase-coach.png",
    alternativeSlugs: [
      "calendly-alternative",
      "alternatives/calendly",
      "best-calendly-alternative",
    ],
    points: [
      {
        title: "What it is",
        hacado: "A booking website for people who sell client work.",
        other: "A meeting scheduler for people who sell calendar slots.",
      },
      {
        title: "Money",
        hacado:
          "Deposits, full pay, gift cards, packages - Stripe, Square, PayPal.",
        other: "Payments are not the center of the product.",
      },
      {
        title: "After they book",
        hacado: "SMS, waitlist offers, client cabinet, activity history.",
        other: "A confirmation and a calendar invite.",
      },
      {
        title: "Brand",
        hacado: "Your pages, your domain, your look.",
        other: "A scheduling page you paste onto a site you already run.",
      },
      {
        title: "Best fit",
        hacadoTitle: "When Hacado wins",
        otherTitle: "When Calendly still wins",
        hacado: "You need deposits, packages, and a public site.",
        other:
          "Internal sales round-robins inside a company that already has a website.",
      },
    ],
    faqs: [
      {
        q: "Is Hacado a Calendly alternative?",
        a: "Yes if you run a client business - coaching, consulting, training, sessions. Calendly stays better for org-wide meeting routing.",
      },
      {
        q: "What does Hacado add beyond Calendly?",
        a: "Website builder, deposits, gift cards, packages, forms, waitlist, SMS, multi-staff, custom domain, and a client cabinet.",
      },
      {
        q: "Who is this for?",
        a: "Coaches, consultants, personal trainers, photographers, tutors, therapists, and freelancers who book clients - not internal standups.",
      },
    ],
    related: [
      { label: "Coaches", href: "/use-cases/coaches" },
      { label: "Consultants", href: "/use-cases/consultants" },
      { label: "Personal trainers", href: "/use-cases/personal-trainers" },
      { label: "Photographers", href: "/use-cases/photographers" },
      { label: "Therapists", href: "/use-cases/therapists" },
      { label: "Tutors", href: "/use-cases/tutors-freelancers" },
      { label: "Freelancers", href: "/use-cases/freelancers" },
    ],
    cta: {
      title: "Stop pasting a meeting link. Run a business.",
      body: "Start free. Add deposits and a domain when the calendar fills.",
    },
  },
  {
    slug: "acuity",
    competitor: "Acuity",
    navLabel: "Acuity alternative",
    seoTitle: "Acuity Alternative With the Website Included | Hacado",
    seoDescription:
      "Acuity often means Squarespace plus a scheduler. Hacado keeps the website, calendar, payments, and SMS in one admin so you are not paying two products to look finished.",
    keywords: [
      "acuity alternative",
      "acuity scheduling alternative",
      "squarespace scheduling alternative",
      "hacado vs acuity",
      "alternative to acuity",
    ],
    heroEyebrow: "Acuity alternative",
    heroTitle: "An Acuity alternative with the website already included",
    lede: "Acuity is strong scheduling next to Squarespace. If you are buying two products to look finished - a site and a scheduler - Hacado keeps both in one login: pages, calendar, deposits, SMS, gift cards.",
    image: "/assets/generated/hero-workspace.png",
    alternativeSlugs: [
      "acuity-alternative",
      "acuity-scheduling-alternative",
      "alternatives/acuity",
    ],
    points: [
      {
        title: "Website",
        hacado: "Builder included. One admin.",
        other: "Often paired with a separate Squarespace (or similar) bill.",
      },
      {
        title: "Stack tax",
        hacado: "One plan for site + book + messages.",
        other: "Scheduler excellence; the finished brand is another product.",
      },
      {
        title: "Extras",
        hacado: "Gift cards, waitlist, cabinet, packages in the same place.",
        other:
          "Packages and intake are strong; the marketing site is elsewhere.",
      },
      {
        title: "Best fit",
        hacadoTitle: "When Hacado wins",
        otherTitle: "When Acuity still wins",
        hacado: "You want one login for site and book.",
        other:
          "You already live in Squarespace and only need the scheduler block.",
      },
    ],
    faqs: [
      {
        q: "Is Hacado a good Acuity alternative?",
        a: "Yes if you do not want a second website product. Stay on Acuity if Squarespace already is home.",
      },
      {
        q: "How is Hacado different from Acuity?",
        a: "The website builder is included. Acuity is often sold next to Squarespace.",
      },
      {
        q: "Can I switch from Acuity?",
        a: "Recreate services and hours, connect payments, point the domain or share the new URL.",
      },
    ],
    cta: {
      title: "Stop paying twice to look finished",
      body: "Site and book in one place. Start free.",
    },
  },
  {
    slug: "glossgenius",
    competitor: "GlossGenius",
    navLabel: "GlossGenius alternative",
    seoTitle: "GlossGenius Alternative: Own Your Booking Website | Hacado",
    seoDescription:
      "Looking past GlossGenius? Hacado is a branded booking website for independent beauty - deposits, gift cards, SMS, and your domain without locking the brand into one beauty-app stack.",
    keywords: [
      "glossgenius alternative",
      "best glossgenius alternative",
      "hacado vs glossgenius",
      "gloss genius alternative",
      "leave glossgenius",
    ],
    heroEyebrow: "GlossGenius alternative",
    heroTitle: "A GlossGenius alternative built around your website - not their app",
    lede: "GlossGenius is popular with US independents who want payments and booking in one beauty-focused app. Hacado is for studios that want the public face to be their own site: multi-page brand, custom domain, gift cards, and a book that still connects the processors you choose.",
    image: "/assets/generated/usecase-nails.png",
    alternativeSlugs: [
      "glossgenius-alternative",
      "alternatives/glossgenius",
      "best-glossgenius-alternative",
      "gloss-genius-alternative",
    ],
    points: [
      {
        title: "Public brand",
        hacado:
          "A full booking website: services, gallery, FAQ, gift cards, your domain.",
        other:
          "A polished beauty app experience - clients often remember the product as much as your URL.",
      },
      {
        title: "Website depth",
        hacado: "Multi-page builder you grow into - not only a booking skin.",
        other: "Strong booking and payments; the marketing site is thinner than a studio site.",
      },
      {
        title: "Who it is for",
        hacado: "Independents who already fill the book from Instagram and Google.",
        other: "Beauty pros who want a beauty-native mobile-first booking app.",
      },
      {
        title: "Best fit",
        hacadoTitle: "When Hacado wins",
        otherTitle: "When GlossGenius still wins",
        hacado: "You want the site to match the work and own the URL clients bookmark.",
        other: "You prefer their mobile-first beauty workflow and do not need a deeper site.",
      },
    ],
    faqs: [
      {
        q: "Is Hacado a good GlossGenius alternative?",
        a: "Yes if you want a branded multi-page website with deposits, gift cards, and SMS on your domain. Stay if you prefer GlossGenius’s beauty-app workflow.",
      },
      {
        q: "Does Hacado replace GlossGenius payments?",
        a: "You connect Stripe, Square, or PayPal. The book is not married to one beauty-app processor.",
      },
      {
        q: "Can I switch from GlossGenius?",
        a: "Publish services and hours on Hacado, connect payments, then put your new URL in the Instagram bio instead of the old booking link.",
      },
    ],
    cta: {
      title: "Make the website the product",
      body: "Start free. Share your URL - not another beauty-app profile.",
    },
  },
  {
    slug: "boulevard",
    competitor: "Boulevard",
    navLabel: "Boulevard alternative",
    seoTitle: "Boulevard Alternative for Independent Studios | Hacado",
    seoDescription:
      "Boulevard is built for modern multi-location salons. Hacado is a lighter branded booking website for independents and small teams who want their own site without enterprise salon suite weight.",
    keywords: [
      "boulevard alternative",
      "boulevard salon alternative",
      "hacado vs boulevard",
      "best boulevard alternative",
      "leave boulevard",
    ],
    heroEyebrow: "Boulevard alternative",
    heroTitle: "A Boulevard alternative when you want a studio site - not a suite",
    lede: "Boulevard targets modern, often multi-location salon brands with a full ops stack. Independent nail, hair, and lash businesses usually need something lighter: a beautiful booking website, deposits, reminders, and a team calendar - without buying enterprise salon software on week one.",
    image: "/assets/generated/usecase-salon.png",
    alternativeSlugs: [
      "boulevard-alternative",
      "alternatives/boulevard",
      "best-boulevard-alternative",
    ],
    points: [
      {
        title: "Product weight",
        hacado: "Booking website + calendar + payments sized for independents and small teams.",
        other: "Modern salon suite breadth aimed at multi-location brands.",
      },
      {
        title: "Independent website",
        hacado: "Your brand, pages, and domain from day one.",
        other: "Strong salon ops; the site is part of a larger enterprise surface.",
      },
      {
        title: "Team",
        hacado: "Studio seats and per-person calendars when you grow past solo.",
        other: "Built for larger front-desk and multi-location workflows.",
      },
      {
        title: "Best fit",
        hacadoTitle: "When Hacado wins",
        otherTitle: "When Boulevard still wins",
        hacado: "One chair or a small floor that already has Instagram demand.",
        other: "Several locations, retail, and suite-grade salon ops in one vendor.",
      },
    ],
    faqs: [
      {
        q: "Is Hacado a lighter Boulevard alternative?",
        a: "Yes for independents and small studios that want a branded booking website without enterprise salon suite complexity.",
      },
      {
        q: "Can a multi-chair salon use Hacado?",
        a: "Studio adds seats and calendars. It is not a multi-location enterprise suite.",
      },
      {
        q: "Does Hacado have a marketplace?",
        a: "No. Your clients belong to you.",
      },
    ],
    cta: {
      title: "Suite-light. Brand-heavy.",
      body: "Publish the site. Add seats when the floor grows.",
    },
  },
  {
    slug: "styleseat",
    competitor: "StyleSeat",
    navLabel: "StyleSeat alternative",
    seoTitle: "StyleSeat Alternative Without Marketplace Discovery | Hacado",
    seoDescription:
      "Leaving StyleSeat? Hacado is a branded booking website without a beauty marketplace sharing your customers. Your page, your list, your brand.",
    keywords: [
      "styleseat alternative",
      "best styleseat alternative",
      "hacado vs styleseat",
      "style seat alternative",
      "leave styleseat",
    ],
    heroEyebrow: "StyleSeat alternative",
    heroTitle: "Leave StyleSeat. Keep the clients. Keep the brand.",
    lede: "StyleSeat mixes booking with marketplace-style discovery for beauty pros. That can fill the book - and it can send the next client to someone nearby. Hacado is for stylists and studios that already have demand and want an independent website instead of another discovery listing.",
    image: "/assets/photos/nails-studio.jpg",
    alternativeSlugs: [
      "styleseat-alternative",
      "alternatives/styleseat",
      "best-styleseat-alternative",
      "style-seat-alternative",
    ],
    points: [
      {
        title: "Marketplace",
        hacado: "None. Instagram and Google stay the funnel.",
        other: "Discovery and marketplace dynamics are part of how clients find you.",
      },
      {
        title: "Independent website",
        hacado: "White-label pages, gallery, policies, gift cards, your domain.",
        other: "Booking sits next to a discovery brand clients already know.",
      },
      {
        title: "Client ownership",
        hacado: "The list lives in your workspace. Reminders go out as you.",
        other: "Rebooks can stay tied to the marketplace habit.",
      },
      {
        title: "Best fit",
        hacadoTitle: "When Hacado wins",
        otherTitle: "When StyleSeat still wins",
        hacado: "You already fill Saturdays from your own audience.",
        other: "StyleSeat discovery is still your primary source of new clients.",
      },
    ],
    faqs: [
      {
        q: "Is Hacado a StyleSeat alternative without a marketplace?",
        a: "Yes. Hacado does not list you in a directory or send clients to a nearby pro.",
      },
      {
        q: "Will I lose marketplace discovery if I leave?",
        a: "Yes - that is the trade for owning the brand. Keep the relationships you already have on your own URL.",
      },
      {
        q: "Do I get a real website?",
        a: "Yes. Multi-page builder and custom domain on Solo - not only a profile page.",
      },
    ],
    cta: {
      title: "Your chair. Your URL.",
      body: "Leave the discovery listing. Open a branded book on Hacado.",
    },
  },
  {
    slug: "goldie",
    competitor: "Goldie",
    navLabel: "Goldie alternative",
    seoTitle: "Goldie Alternative for Barbers & Beauty Pros | Hacado",
    seoDescription:
      "Goldie is a popular booking app for barbers and beauty. Hacado is a branded booking website with deposits, gift cards, SMS, and your domain - built for independents who want more than an app link.",
    keywords: [
      "goldie alternative",
      "goldie app alternative",
      "hacado vs goldie",
      "best goldie alternative",
      "goldie booking alternative",
    ],
    heroEyebrow: "Goldie alternative",
    heroTitle: "A Goldie alternative with a real website behind the book",
    lede: "Goldie is a sleek booking app many barbers and beauty independents share from Instagram. Hacado keeps the easy book - and adds a multi-page website, gift cards, packages, and SMS so the public face is your brand, not only an app link.",
    image: "/assets/generated/usecase-salon.png",
    alternativeSlugs: [
      "goldie-alternative",
      "alternatives/goldie",
      "best-goldie-alternative",
    ],
    points: [
      {
        title: "What clients open",
        hacado: "Your site and domain - gallery, policies, gift cards, book.",
        other: "A focused booking app experience shared as a link.",
      },
      {
        title: "Revenue tools",
        hacado: "Deposits, gift cards, packages, discounts on the same brand.",
        other: "Strong booking; less of a full studio website surface.",
      },
      {
        title: "Best fit",
        hacadoTitle: "When Hacado wins",
        otherTitle: "When Goldie still wins",
        hacado: "You want Instagram to land on a site that looks like the shop.",
        other: "A lightweight app link is enough and you do not need deeper pages.",
      },
    ],
    faqs: [
      {
        q: "Is Hacado a good Goldie alternative for barbers?",
        a: "Yes if you want a branded website with deposits and reminders. Stay on Goldie if a simple app book is all you need.",
      },
      {
        q: "Can chair renters use Hacado?",
        a: "Yes. Solo for one calendar; Studio when the floor shares a brand with several people.",
      },
      {
        q: "Does Hacado have a marketplace?",
        a: "No. You bring the demand; we run the book and the site.",
      },
    ],
    cta: {
      title: "More than a booking link",
      body: "Publish the site. Put the URL in the bio.",
    },
  },
  {
    slug: "squire",
    competitor: "Squire",
    navLabel: "Squire alternative",
    seoTitle: "Squire Alternative for Barbershops | Hacado",
    seoDescription:
      "Squire is barbershop-native booking and payments. Hacado is a branded booking website for barbers and beauty teams who want their own site, deposits, and SMS without a barber-marketplace stack.",
    keywords: [
      "squire alternative",
      "squire barber alternative",
      "hacado vs squire",
      "best squire alternative",
      "leave squire",
    ],
    heroEyebrow: "Squire alternative",
    heroTitle: "A Squire alternative when the shop wants its own website",
    lede: "Squire is built around barbershop booking and payments. Shops that already fill chairs from Instagram and walk-ins often want a lighter branded site - services, team calendars, deposits, reminders - without committing to a barber-specific suite forever.",
    image: "/assets/photos/desk-calendar.jpg",
    alternativeSlugs: [
      "squire-alternative",
      "alternatives/squire",
      "best-squire-alternative",
    ],
    points: [
      {
        title: "Vertical focus",
        hacado: "Beauty and wellness booking website - barbers included, not locked to one trade.",
        other: "Barbershop-native product surface and payments.",
      },
      {
        title: "Website",
        hacado: "Multi-page brand you own. Custom domain on Solo.",
        other: "Booking and shop tools first; marketing site depth varies.",
      },
      {
        title: "Best fit",
        hacadoTitle: "When Hacado wins",
        otherTitle: "When Squire still wins",
        hacado: "You want one branded site for the shop and a choice of processors.",
        other: "You want barber-specific suite features end-to-end.",
      },
    ],
    faqs: [
      {
        q: "Is Hacado a Squire alternative for barbershops?",
        a: "Yes if you want a branded booking website and team calendars without a barber-only suite. Stay on Squire if their vertical tools are the center of the shop.",
      },
      {
        q: "Can multiple barbers share one Hacado site?",
        a: "Studio seats and per-person calendars. Clients pick a favorite or the next opening.",
      },
      {
        q: "Do you take marketplace commission?",
        a: "No. There is no client directory.",
      },
    ],
    cta: {
      title: "The shop’s site. The shop’s book.",
      body: "Start free. Add seats when the chairs fill.",
    },
  },
  {
    slug: "mindbody",
    competitor: "Mindbody",
    navLabel: "Mindbody alternative",
    seoTitle: "Mindbody Alternative Without Marketplace Fees | Hacado",
    seoDescription:
      "Leaving Mindbody? Hacado is a branded booking website for wellness and beauty studios - your clients, your brand, no marketplace directory taking a cut of discovery.",
    keywords: [
      "mindbody alternative",
      "best mindbody alternative",
      "hacado vs mindbody",
      "mindbody competitor",
      "leave mindbody",
    ],
    heroEyebrow: "Mindbody alternative",
    heroTitle: "Leave Mindbody. Keep the clients. Skip the marketplace.",
    lede: "Mindbody is a large wellness marketplace and ops platform. Studios that already have demand often want out of directory economics and into a site they own. Hacado is a branded booking website for beauty and wellness - calendar, deposits, SMS, gift cards - without listing you next to every studio in town.",
    image: "/assets/generated/usecase-coach.png",
    alternativeSlugs: [
      "mindbody-alternative",
      "alternatives/mindbody",
      "best-mindbody-alternative",
    ],
    points: [
      {
        title: "Marketplace",
        hacado: "None. No directory commission on discovery.",
        other: "Marketplace discovery and platform economics are core to the pitch.",
      },
      {
        title: "Independent website",
        hacado: "Your brand on every page and reminder.",
        other: "Clients often find and rebook through the Mindbody surface.",
      },
      {
        title: "Product weight",
        hacado: "Studio-sized booking website stack.",
        other: "Enterprise wellness breadth - powerful and heavier than a small studio needs.",
      },
      {
        title: "Best fit",
        hacadoTitle: "When Hacado wins",
        otherTitle: "When Mindbody still wins",
        hacado: "You have Instagram and Google demand and want to own the book.",
        other: "You still rely on Mindbody marketplace for most new clients.",
      },
    ],
    faqs: [
      {
        q: "Is Hacado a Mindbody alternative without a marketplace?",
        a: "Yes. Hacado does not list you in a wellness directory.",
      },
      {
        q: "Will I lose Mindbody discovery if I leave?",
        a: "Marketplace discovery stops. Keep existing clients on your own URL and grow from channels you own.",
      },
      {
        q: "Is Hacado only for beauty?",
        a: "Beauty and wellness are the center. Coaches, therapists, and studios use the same booking website stack.",
      },
    ],
    cta: {
      title: "Own the book. Skip the directory.",
      body: "Start free. Publish your site. Send your URL.",
    },
  },
];

export function compareHref(slug: string) {
  return `/compare/${slug}`;
}

export function compareAlternativeRedirects() {
  return comparePages.flatMap((c) =>
    c.alternativeSlugs.map((from) => ({
      from,
      to: compareHref(c.slug),
      title: c.seoTitle,
      description: c.seoDescription,
    })),
  );
}

export const homeFaqs = [
  {
    q: "Do I need to know how to code?",
    a: "No. If you can use email, you can publish a Hacado site. Drag, drop, and share the link.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. Free includes a branded site (up to 10 pages), one service, 15 appointments per cycle, calendar sync, email, and 30 days of activity history. Payments and custom domain start on Solo.",
  },
  {
    q: "Can I use my own domain?",
    a: "On Solo and Studio. Free includes yourbusiness.hacado.me.",
  },
  {
    q: "Will ChatGPT find my business?",
    a: "Hacado can publish a plain-language summary of your pages, services, and team for ChatGPT and similar assistants, plus structured details that help Google understand your site. Turn those apps on in the store - nothing technical to install.",
  },
  {
    q: "Is this only for beauty?",
    a: "Beauty and wellness are the center - nails, hair, tattoo, lash, studios. Coaches, consultants, and other client businesses use the same booking website stack.",
  },
  {
    q: "Can I sell gift cards and packages?",
    a: "Yes, on Solo and Studio. Design gift cards and sell them on your site; packages are prepaid session bundles. Discounts have seasonal windows and rules for where they apply.",
  },
  {
    q: "Can I see where people drop off in booking?",
    a: "Yes. Booking tracking on Solo shows conversion to an appointment or waitlist, and which step they stop on — availability, payment, the form. Merely opening the page does not count as abandoned.",
  },
  {
    q: "Can clients reschedule themselves?",
    a: "Yes, in the client cabinet on Solo — inside windows you set. You can also confirm, edit the service, decline, cancel, or mark no-show from Appointments on every plan. Auto-confirm is optional; pending requests wait for you.",
  },
  {
    q: "How do I cancel?",
    a: "Anytime from the Polar billing portal in settings. No long-term contract.",
  },
];

export const pricingFaqs = [
  {
    q: "What do Solo and Studio cost?",
    a: "Solo is $29/month ($348 if billed annually). Studio is $59/month ($708 annually) and includes 5 team members. Extra Studio seats start at $4/month.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes. Upgrade, downgrade, or cancel from the Polar customer portal in brand settings. Extra Studio seats start at $4/month.",
  },
  {
    q: "What happens if I hit 15 appointments on Free?",
    a: "New bookings pause until the next cycle or you move to Solo.",
  },
  {
    q: "What is included for a team?",
    a: "Studio includes 5 seats and per-person calendars. Extra seats start at $4/month. Free and Solo are single-user.",
  },
  {
    q: "Are gift cards, discounts, and packages on Solo?",
    a: "Yes. Gift Card Studio (design + sell on your website), discounts with date and service rules, and prepaid packages are Solo and Studio.",
  },
  {
    q: "How long is activity history kept?",
    a: "Everyday events stay 30 days on Free, 90 on Solo, and 365 on Studio. Payments, permissions, and other important records never expire on any plan.",
  },
];

export function compareBySlug(slug: string) {
  return comparePages.find((c) => c.slug === slug);
}
