/**
 * Topic landing pages beyond feature / use-case / compare templates:
 * category hubs, migration guides, feature×persona, integration landers.
 */

export type SeoLandingPage = {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  heroEyebrow: string;
  heroTitle: string;
  heroBody: string;
  image: string;
  sections: { title: string; body: string }[];
  bullets?: string[];
  links?: { label: string; href: string }[];
  faqs?: { q: string; a: string }[];
  cta?: { title: string; body: string };
  /** Extra paths that 301 to this page */
  alternativeSlugs?: string[];
};

export const categoryHubPages: SeoLandingPage[] = [
  {
    slug: "booking-website-for-salons",
    seoTitle: "Booking Website for Salons | Branded Online Book | Hacado",
    seoDescription:
      "A branded booking website for salons and multi-chair studios. Services, staff calendars, deposits, SMS, gift cards - your clients, no marketplace commission.",
    keywords: [
      "booking website for salons",
      "salon booking website",
      "online booking for salons",
      "salon appointment website",
      "branded salon booking",
    ],
    heroEyebrow: "For salons",
    heroTitle: "A booking website for salons that looks like your floor",
    heroBody:
      "Clients pick a stylist or the next opening, pay a deposit, and get an SMS the day before - on a site that is your brand, not a marketplace listing.",
    image: "/assets/generated/usecase-salon.png",
    bullets: [
      "Multi-page site with your domain on Solo",
      "Per-person calendars on Studio",
      "Deposits, gift cards, packages, SMS",
      "No client-directory commission",
    ],
    sections: [
      {
        title: "One public brand. Several chairs.",
        body: "Studio seats give each person a calendar while the website stays one brand. Clients bookmark your URL - not an app that also lists the shop next door.",
      },
      {
        title: "Built for beauty demand you already have",
        body: "Instagram, Google, and walk-ins bring people. Hacado converts them: service menu, policies, gallery, and a book that takes deposits so Saturdays stay filled.",
      },
    ],
    links: [
      { label: "Salons & clinics use case", href: "/use-cases/salons-clinics" },
      { label: "Staff management", href: "/features/team" },
      { label: "Fresha alternative", href: "/compare/fresha" },
      { label: "Pricing", href: "/pricing" },
    ],
    faqs: [
      {
        q: "Is Hacado a booking website for multi-chair salons?",
        a: "Yes. Studio adds seats and calendars. Free and Solo are single-user.",
      },
      {
        q: "Do you take marketplace commission?",
        a: "No. There is no client directory.",
      },
    ],
    cta: {
      title: "Open the salon’s book on your domain",
      body: "Start free. Add seats when the floor grows.",
    },
  },
  {
    slug: "online-booking-for-nail-salons",
    seoTitle: "Online Booking for Nail Salons & Techs | Hacado",
    seoDescription:
      "Online booking for nail salons and solo techs: sets, fills, add-ons, deposits, SMS, and gift cards on a branded website - without a marketplace.",
    keywords: [
      "online booking for nail salons",
      "nail salon booking website",
      "nail tech online booking",
      "nail appointment booking",
      "booking system for nail technicians",
    ],
    heroEyebrow: "For nail businesses",
    heroTitle: "Online booking for nail salons that stops the DM chaos",
    heroBody:
      "Gel vs acrylic, fills vs full sets, art as add-ons - clients book and deposit on your site while you are still at the table.",
    image: "/assets/generated/usecase-nails.png",
    bullets: [
      "Service menu with add-ons and durations",
      "Deposits so the chair stays booked",
      "SMS before fills every 2–3 weeks",
      "Gift cards sold on your website",
    ],
    sections: [
      {
        title: "The menu has to match the work",
        body: "When duration and price are on the page, clients stop guessing in Instagram DMs. Duplicate-booking checks can warn someone who already has a fill this cycle.",
      },
      {
        title: "Your book, not a directory",
        body: "Hacado is not Booksy or Fresha. There is no marketplace commission and no “similar artists nearby.”",
      },
    ],
    links: [
      { label: "Nail artists use case", href: "/use-cases/nail-artists" },
      { label: "Deposits for nail techs", href: "/deposits-for-nail-techs" },
      { label: "Booksy alternative", href: "/compare/booksy" },
      { label: "Payments", href: "/features/payments" },
    ],
    faqs: [
      {
        q: "Can solo nail techs use Hacado?",
        a: "Yes. Free to publish; Solo when you need deposits, SMS credits, and a custom domain.",
      },
      {
        q: "Can I sell gift cards for sets?",
        a: "Yes on Solo and Studio - design and sell on your site.",
      },
    ],
    cta: {
      title: "Put the book next to the gallery",
      body: "Start free. Share one link from the bio.",
    },
  },
  {
    slug: "booking-system-without-marketplace",
    seoTitle: "Booking System Without a Marketplace | Hacado",
    seoDescription:
      "A booking system without a marketplace or client directory. Branded website, calendar, deposits, SMS, and gift cards - you own the clients.",
    keywords: [
      "booking system without marketplace",
      "appointment software no marketplace",
      "salon software without directory",
      "booking website no commission",
      "independent booking system",
    ],
    heroEyebrow: "No marketplace",
    heroTitle: "A booking system without a marketplace sharing your clients",
    heroBody:
      "Discovery apps rent you demand and list you next to competitors. Hacado runs the book on your brand - Instagram and Google stay the funnel.",
    image: "/assets/generated/hero-workspace.png",
    bullets: [
      "No client directory",
      "No marketplace commission",
      "Your domain on Solo",
      "Reminders go out as you",
    ],
    sections: [
      {
        title: "What you give up - on purpose",
        body: "You do not get app-store faucet demand. You keep the relationships you already have and grow from channels you own.",
      },
      {
        title: "What you get instead",
        body: "A multi-page booking website, deposits, waitlist, gift cards, packages, SMS, and staff calendars when you need them.",
      },
    ],
    links: [
      { label: "Compare alternatives", href: "/compare" },
      { label: "How to leave a marketplace", href: "/how-to-leave-a-booking-marketplace" },
      { label: "Salon software no commission", href: "/salon-software-no-commission" },
      { label: "Migrate from Fresha", href: "/migrate-from-fresha" },
    ],
    faqs: [
      {
        q: "Does Hacado list me in a directory?",
        a: "No. That is intentional.",
      },
      {
        q: "Who is this for?",
        a: "Independents and small studios that already get demand from Instagram, Google, and word of mouth.",
      },
    ],
    cta: {
      title: "Own the book",
      body: "Start free. No marketplace. Your site, your clients.",
    },
  },
  {
    slug: "salon-software-no-commission",
    seoTitle: "Salon Software with No Commission | Hacado",
    seoDescription:
      "Salon software with no marketplace commission. Pay a plan for a branded booking website, calendars, deposits, and SMS - keep the client list.",
    keywords: [
      "salon software no commission",
      "salon booking no commission",
      "beauty software without commission",
      "salon software subscription only",
      "no commission booking software",
    ],
    heroEyebrow: "No commission",
    heroTitle: "Salon software you pay for with a plan - not a cut of every client",
    heroBody:
      "Marketplace platforms earn when discovery sends bookings. Hacado does not run a client directory. You pay Solo or Studio; the list stays yours.",
    image: "/assets/photos/nails-studio.jpg",
    bullets: [
      "Subscription pricing - see /pricing",
      "No client-directory cut",
      "Branded site + book in one admin",
      "Stripe, Square, or PayPal",
    ],
    sections: [
      {
        title: "Commission vs plan",
        body: "If your growth already comes from Instagram and Google, paying a marketplace cut for “discovery” you do not need is expensive. A plan that funds the website and the book is simpler math.",
      },
      {
        title: "Still take online payments",
        body: "Deposits and balances run through the processor you connect. That is payment processing - not a Hacado marketplace commission.",
      },
    ],
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Booking without marketplace", href: "/booking-system-without-marketplace" },
      { label: "Fresha alternative", href: "/compare/fresha" },
      { label: "Booksy alternative", href: "/compare/booksy" },
    ],
    faqs: [
      {
        q: "Does Hacado take a percentage of bookings?",
        a: "No marketplace commission. You pay a plan. Card processors charge their normal rates.",
      },
      {
        q: "Is Free really free?",
        a: "Yes for a branded site with limits. Payments and custom domain start on Solo.",
      },
    ],
    cta: {
      title: "Pay for software. Keep the clients.",
      body: "Compare plans. Cancel anytime from billing settings.",
    },
  },
];

export const migrationGuidePages: SeoLandingPage[] = [
  {
    slug: "migrate-from-fresha",
    seoTitle: "Migrate from Fresha to Hacado | Keep Your Clients",
    seoDescription:
      "How to leave Fresha for a branded Hacado booking website. Move services, hours, and clients to your own URL - without a marketplace.",
    keywords: [
      "migrate from fresha",
      "leave fresha",
      "switch from fresha",
      "fresha to hacado",
      "move off fresha",
    ],
    heroEyebrow: "Leaving Fresha",
    heroTitle: "Migrate from Fresha without losing the clients you already have",
    heroBody:
      "Publish your Hacado site, recreate services and hours, then send your URL instead of the marketplace profile. Marketplace discovery stops; your brand takes over.",
    image: "/assets/generated/usecase-nails.png",
    alternativeSlugs: ["leave-fresha", "switch-from-fresha"],
    sections: [
      {
        title: "1. Publish the Hacado site first",
        body: "Create the workspace, add services with durations and prices, set hours, connect calendar if you use one, and preview the booking flow before you change Instagram.",
      },
      {
        title: "2. Move the relationships",
        body: "Export or manually invite existing clients to book on your new URL. Keep the Fresha listing quiet until your site takes deposits the way you expect.",
      },
      {
        title: "3. Cut over the bio and Google",
        body: "Replace the Fresha link with your Hacado URL (custom domain on Solo). Update Google Business and any cards or QR codes.",
      },
      {
        title: "4. What you leave behind",
        body: "Fresha marketplace discovery and “similar nearby.” That is the trade for owning the client list and the brand on every reminder.",
      },
    ],
    links: [
      { label: "Fresha alternative (full compare)", href: "/compare/fresha" },
      { label: "Import clients into Hacado", href: "/import-clients-into-hacado" },
      { label: "How to leave a marketplace", href: "/how-to-leave-a-booking-marketplace" },
      { label: "Pricing", href: "/pricing" },
    ],
    faqs: [
      {
        q: "Will I lose clients if I leave Fresha?",
        a: "You keep people who already know you - move them to your URL. New marketplace discovery stops.",
      },
      {
        q: "Is there a one-click Fresha import?",
        a: "Recreate services and hours in Hacado, then bring clients over with your list and a clear new booking link. See the import clients guide.",
      },
    ],
    cta: {
      title: "Keep your bookings. Keep your brand.",
      body: "Start free. Publish the site. Then change the bio.",
    },
  },
  {
    slug: "migrate-from-booksy",
    seoTitle: "Migrate from Booksy to Hacado | Own Your Book",
    seoDescription:
      "How to leave Booksy for Hacado. Move off the marketplace listing to a branded booking website - your clients, your domain, no directory.",
    keywords: [
      "migrate from booksy",
      "leave booksy",
      "switch from booksy",
      "booksy to hacado",
      "move off booksy",
    ],
    heroEyebrow: "Leaving Booksy",
    heroTitle: "Migrate from Booksy and put the book on your own website",
    heroBody:
      "Booksy’s app marketplace can fill the chair - and share attention with nearby listings. Hacado is the cutover for studios ready to own the URL.",
    image: "/assets/photos/nails-studio.jpg",
    alternativeSlugs: ["leave-booksy", "switch-from-booksy"],
    sections: [
      {
        title: "1. Mirror the menu on Hacado",
        body: "Rebuild services, add-ons, and hours. Connect payments (Stripe, Square, or PayPal) and turn on deposits if no-shows hurt.",
      },
      {
        title: "2. Tell regulars once",
        body: "SMS, email, or Instagram story: “Book here from now on” with your Hacado link. Make the first visit on the new site easy.",
      },
      {
        title: "3. Retire the marketplace profile",
        body: "When the new book is live, remove or pause the Booksy listing so clients are not split across two systems.",
      },
    ],
    links: [
      { label: "Booksy alternative (full compare)", href: "/compare/booksy" },
      { label: "Import clients into Hacado", href: "/import-clients-into-hacado" },
      { label: "Nail salon booking", href: "/online-booking-for-nail-salons" },
      { label: "Pricing", href: "/pricing" },
    ],
    faqs: [
      {
        q: "Is Hacado a good Booksy alternative?",
        a: "Yes if you want to own the page and the list. No if you still depend on Booksy’s marketplace for most new bookings.",
      },
      {
        q: "Does Hacado take marketplace commission?",
        a: "No. There is no client directory.",
      },
    ],
    cta: {
      title: "Your clients belong to you",
      body: "Leave the directory. Open a branded book on Hacado.",
    },
  },
  {
    slug: "how-to-leave-a-booking-marketplace",
    seoTitle: "How to Leave a Booking Marketplace | Hacado",
    seoDescription:
      "How to leave Fresha, Booksy, StyleSeat, or Mindbody for a branded booking website. Keep your clients, own the URL, skip directory commission.",
    keywords: [
      "how to leave a booking marketplace",
      "leave salon marketplace",
      "switch from marketplace booking",
      "own your booking clients",
      "booking without marketplace",
    ],
    heroEyebrow: "Switcher guide",
    heroTitle: "How to leave a booking marketplace without stranding your clients",
    heroBody:
      "Whether you are on Fresha, Booksy, StyleSeat, or Mindbody, the cutover pattern is the same: stand up your site, move regulars, then change the public links.",
    image: "/assets/generated/hero-workspace.png",
    sections: [
      {
        title: "Stand up the destination first",
        body: "Do not delete the marketplace profile on Monday morning. Publish Hacado, test a real booking with a deposit, and confirm reminders look like your brand.",
      },
      {
        title: "Migrate the people who already trust you",
        body: "Your existing list is the asset. Message them with one new URL. Marketplace discovery of strangers is what you are choosing to leave.",
      },
      {
        title: "Change every public entry point",
        body: "Instagram bio, Google Business, Linktree, printed cards, email signatures. Split funnels create double-books and confusion.",
      },
      {
        title: "Then retire the listing",
        body: "Pause or remove the marketplace profile once the new book is the habit. Read the Fresha or Booksy migrate guides for product-specific notes.",
      },
    ],
    links: [
      { label: "Migrate from Fresha", href: "/migrate-from-fresha" },
      { label: "Migrate from Booksy", href: "/migrate-from-booksy" },
      { label: "Booking without marketplace", href: "/booking-system-without-marketplace" },
      { label: "All compare pages", href: "/compare" },
    ],
    faqs: [
      {
        q: "Will I get fewer new clients?",
        a: "You lose marketplace discovery. You keep growth from Instagram, Google, and referrals - on a brand you own.",
      },
      {
        q: "Which marketplaces does this apply to?",
        a: "Any directory-style book: Fresha, Booksy, StyleSeat, Mindbody, and similar. Use the dedicated migrate pages when you have one.",
      },
    ],
    cta: {
      title: "Leave the directory on your terms",
      body: "Start free. Publish first. Switch the bio second.",
    },
  },
  {
    slug: "import-clients-into-hacado",
    seoTitle: "Import Clients into Hacado | Move Your List",
    seoDescription:
      "How to bring clients into Hacado from Fresha, Booksy, or a spreadsheet. Keep the relationships on your branded booking website.",
    keywords: [
      "import clients into hacado",
      "import clients from fresha",
      "migrate client list booking",
      "move clients to new booking system",
      "salon client import",
    ],
    heroEyebrow: "Client list",
    heroTitle: "Import clients into Hacado and keep the relationships",
    heroBody:
      "Your list is the reason to leave a marketplace. Bring people into your workspace, then send one booking URL that looks like you.",
    image: "/assets/photos/phone-booking.jpg",
    alternativeSlugs: ["import-clients-from-fresha"],
    sections: [
      {
        title: "Export what the old tool allows",
        body: "Download contacts from Fresha, Booksy, or your spreadsheet (name, phone, email, notes). Clean duplicates before you invite anyone to book.",
      },
      {
        title: "Add them to your Hacado workspace",
        body: "Create client records in Hacado (manually or via the tools available in your plan). Attach notes you need for the next visit - preferences, allergies, usual service.",
      },
      {
        title: "Invite once with the new URL",
        body: "A short message beats a silent cutover: here is where you book from now on. Link to your Hacado site (custom domain on Solo).",
      },
      {
        title: "Do not run two books forever",
        body: "Parallel marketplace + Hacado calendars cause double-books. Finish the migrate-from guide, then retire the old listing.",
      },
    ],
    links: [
      { label: "Client management", href: "/features/clients" },
      { label: "Migrate from Fresha", href: "/migrate-from-fresha" },
      { label: "Migrate from Booksy", href: "/migrate-from-booksy" },
      { label: "Contact support", href: "/support" },
    ],
    faqs: [
      {
        q: "Can Hacado pull my Fresha clients automatically?",
        a: "Plan on an export from the old tool plus inviting people to your new URL. Support can help if you are stuck on a messy list.",
      },
      {
        q: "Should I import before or after going live?",
        a: "Import and message regulars as soon as the booking flow is tested - before you remove the marketplace profile.",
      },
    ],
    cta: {
      title: "The list is yours",
      body: "Open a workspace. Bring the people who already book you.",
    },
  },
];

export const featurePersonaPages: SeoLandingPage[] = [
  {
    slug: "deposits-for-nail-techs",
    seoTitle: "Deposits for Nail Techs | Stop No-Shows | Hacado",
    seoDescription:
      "Take booking deposits for nail techs and nail salons. Card before the Saturday slot - on a branded website with SMS reminders.",
    keywords: [
      "deposits for nail techs",
      "nail salon booking deposit",
      "nail tech no show deposit",
      "require deposit nail appointment",
    ],
    heroEyebrow: "Nail techs",
    heroTitle: "Deposits for nail techs so the chair stays booked",
    heroBody:
      "Ask for a card before someone takes a Saturday set. Combine deposits with SMS reminders and a clear cancellation window on your site.",
    image: "/assets/generated/usecase-nails.png",
    bullets: [
      "Deposit or full pay at booking",
      "Stripe, Square, or PayPal",
      "Policies on the same page as the book button",
      "SMS the day before",
    ],
    sections: [
      {
        title: "Why DMs fail",
        body: "A screenshot of your grid is not a contract. Deposits turn interest into a held slot and filter tire-kickers.",
      },
      {
        title: "Same stack for fills",
        body: "Fills every 2–3 weeks need the same honesty: duration on the menu, deposit when you require it, reminder before they ghost.",
      },
    ],
    links: [
      { label: "Nail artists use case", href: "/use-cases/nail-artists" },
      { label: "Payments", href: "/features/payments" },
      { label: "Online booking for nail salons", href: "/online-booking-for-nail-salons" },
      { label: "Deposits for stylists", href: "/deposits-for-stylists" },
    ],
    cta: {
      title: "Require the deposit on Solo",
      body: "Free to publish. Payments start when you are ready.",
    },
  },
  {
    slug: "deposits-for-stylists",
    seoTitle: "Deposits for Hair Stylists & Barbers | Hacado",
    seoDescription:
      "Booking deposits for hair stylists and barbers. Protect long appointments with prepaid holds on your branded booking website.",
    keywords: [
      "deposits for hair stylists",
      "barber booking deposit",
      "hair appointment deposit",
      "stylist no show deposit",
    ],
    heroEyebrow: "Hair & barbers",
    heroTitle: "Deposits for stylists when the appointment runs long",
    heroBody:
      "Color, cuts, and barber blocks eat the afternoon. A deposit on your site beats a vague “see you Saturday” in the DMs.",
    image: "/assets/generated/usecase-salon.png",
    sections: [
      {
        title: "Honest availability",
        body: "Long services need real duration on the menu. Deposits make that time worth defending.",
      },
      {
        title: "Chair renters included",
        body: "Your book can look like your business even when the floor is shared - one link, your brand, your deposit rules.",
      },
    ],
    links: [
      { label: "Hair & barbers use case", href: "/use-cases/hair-stylists" },
      { label: "Payments", href: "/features/payments" },
      { label: "Goldie alternative", href: "/compare/goldie" },
      { label: "Squire alternative", href: "/compare/squire" },
    ],
    cta: {
      title: "Hold the chair with a card",
      body: "Connect payments on Solo. Publish the policy once.",
    },
  },
  {
    slug: "gift-cards-for-salons",
    seoTitle: "Gift Cards for Salons & Lash Techs | Hacado",
    seoDescription:
      "Sell gift cards on your salon or lash booking website. Branded cards for birthdays and holidays - Solo and Studio.",
    keywords: [
      "gift cards for salons",
      "salon gift card website",
      "lash tech gift cards",
      "sell gift cards online beauty",
    ],
    heroEyebrow: "Revenue",
    heroTitle: "Gift cards for salons and lash techs on your own site",
    heroBody:
      "Friends buy for birthdays without you handwriting a voucher. Design and sell gift cards on the same brand as the book.",
    image: "/assets/generated/mock-gift-checkout.png",
    sections: [
      {
        title: "Between appointments",
        body: "Gift cards and packages turn quiet weeks into prepaid visits. Seasonal discounts can target named services so you are not discounting everything.",
      },
      {
        title: "Lash fills and salon floors",
        body: "Cadence businesses (lashes, nails) and multi-chair salons both benefit from a gift card page next to booking.",
      },
    ],
    links: [
      { label: "Gift cards feature", href: "/features/gift-cards" },
      { label: "Packages", href: "/features/packages" },
      { label: "Lash & brow use case", href: "/use-cases/lash-and-brow" },
      { label: "Salons use case", href: "/use-cases/salons-clinics" },
    ],
    cta: {
      title: "Sell the card on your domain",
      body: "Gift Card Studio is on Solo and Studio.",
    },
  },
  {
    slug: "sms-reminders-for-beauty",
    seoTitle: "SMS Reminders for Beauty Businesses | Hacado",
    seoDescription:
      "SMS appointment reminders for nail, hair, lash, and salon businesses. Cut no-shows with texts that go out as your brand.",
    keywords: [
      "sms reminders for beauty",
      "salon sms reminders",
      "nail appointment text reminder",
      "beauty booking sms",
    ],
    heroEyebrow: "Reminders",
    heroTitle: "SMS reminders for beauty businesses that hate no-shows",
    heroBody:
      "Email alone is not enough for fills and color appointments. Hacado sends SMS from your booking stack - with credits on Solo and Studio.",
    image: "/assets/photos/phone-booking.jpg",
    sections: [
      {
        title: "The day-before text",
        body: "Clients confirm or reschedule before you lose the slot. Pair SMS with a clear cancellation window on the site.",
      },
      {
        title: "Cadence businesses",
        body: "Lash fills and nail fills live on a 2–3 week rhythm. Automated nudges beat hoping they remember.",
      },
    ],
    links: [
      { label: "Email & SMS feature", href: "/features/notifications" },
      { label: "Resend / SMS integration", href: "/integrations/sms-notifications" },
      { label: "Appointments", href: "/features/appointments" },
      { label: "Pricing", href: "/pricing" },
    ],
    cta: {
      title: "Turn on reminders",
      body: "SMS credits included on Solo and Studio - buy more when you need them.",
    },
  },
  {
    slug: "staff-booking-for-salons",
    seoTitle: "Staff Booking for Salons | Team Calendars | Hacado",
    seoDescription:
      "Staff booking for salons: several calendars, one branded website. Clients pick a favorite or the next opening on Studio.",
    keywords: [
      "staff booking for salons",
      "salon team scheduling",
      "multi staff salon booking",
      "salon employee calendar booking",
    ],
    heroEyebrow: "Teams",
    heroTitle: "Staff booking for salons without a marketplace suite",
    heroBody:
      "Studio seats and per-person calendars under one public brand. Hiring should not mean buying a new marketplace.",
    image: "/assets/generated/usecase-salon.png",
    sections: [
      {
        title: "One site. Several books.",
        body: "Clients see your brand first. They choose a person or the next free chair. Roles keep the front desk from living in a spreadsheet.",
      },
      {
        title: "Grow from Solo",
        body: "Start alone on Free or Solo. Move to Studio when the floor needs seats - same website, more calendars.",
      },
    ],
    links: [
      { label: "Staff management", href: "/features/team" },
      { label: "Salons & clinics", href: "/use-cases/salons-clinics" },
      { label: "Booking website for salons", href: "/booking-website-for-salons" },
      { label: "Boulevard alternative", href: "/compare/boulevard" },
    ],
    cta: {
      title: "Add the team on Studio",
      body: "Five seats included. Extra seats from $4/month.",
    },
  },
  {
    slug: "booking-website-with-stripe",
    seoTitle: "Booking Website with Stripe | Payments on Your Site | Hacado",
    seoDescription:
      "A branded booking website with Stripe (or Square or PayPal). Deposits and balances on your domain - not locked to one processor’s thin booking page.",
    keywords: [
      "booking website with stripe",
      "stripe appointment booking website",
      "online booking stripe salon",
      "booking website payments",
    ],
    heroEyebrow: "Payments",
    heroTitle: "A booking website with Stripe - and a real brand behind it",
    heroBody:
      "Connect Stripe for deposits and checkout, or use Square or PayPal. The site is yours; the processor is a choice.",
    image: "/assets/generated/mock-gift-checkout.png",
    sections: [
      {
        title: "Website first. Processor optional.",
        body: "Square Appointments locks the book to Square. Hacado publishes the multi-page site first, then connects the money you already trust.",
      },
      {
        title: "Deposits, gift cards, packages",
        body: "Same payment connection powers holds, gift card sales, and prepaid bundles on Solo and Studio.",
      },
    ],
    links: [
      { label: "Payments feature", href: "/features/payments" },
      { label: "Stripe integration", href: "/integrations/stripe" },
      { label: "Square Appointments alternative", href: "/compare/square-appointments" },
      { label: "Pricing", href: "/pricing" },
    ],
    cta: {
      title: "Connect Stripe on Solo",
      body: "Publish free. Take money when the book is ready.",
    },
  },
];

export const integrationLandingPages: SeoLandingPage[] = [
  {
    slug: "integrations/google-calendar",
    seoTitle: "Google Calendar Booking Website | Hacado",
    seoDescription:
      "Two-way Google Calendar sync on your Hacado booking website. Appointments appear on Google; busy time blocks public slots. Optional Google Meet.",
    keywords: [
      "google calendar booking website",
      "google calendar appointment scheduling",
      "booking site google calendar sync",
      "hacado google calendar",
    ],
    heroEyebrow: "Google Calendar",
    heroTitle: "A booking website that stays honest with Google Calendar",
    heroBody:
      "Hacado appointments land on the Google calendar you choose. Existing Google events block public booking so clients never see a slot you cannot take.",
    image: "/assets/generated/mock-admin-calendar.png",
    sections: [
      {
        title: "Two-way sync",
        body: "Bookings write to Google. Personal or secondary calendars can count as busy so school and life stay off the book.",
      },
      {
        title: "Optional Meet",
        body: "Online services can attach Google Meet when Calendar is connected with the right scopes.",
      },
    ],
    links: [
      { label: "Calendars & video feature", href: "/features/calendars-video" },
      { label: "All integrations", href: "/integrations" },
      { label: "Outlook booking", href: "/integrations/outlook" },
      { label: "Docs: Google Calendar", href: "https://docs.hacado.com/docs/apps/google-calendar" },
    ],
    faqs: [
      {
        q: "Is sync two-way?",
        a: "Yes for the calendar you pick for appointments. ICS feeds are import-only busy time - separate from Google Calendar.",
      },
    ],
    cta: {
      title: "Connect Google Calendar",
      body: "Apps → Store in your workspace. Start free.",
    },
  },
  {
    slug: "integrations/outlook",
    seoTitle: "Outlook Calendar Booking | CalDAV & Exchange | Hacado",
    seoDescription:
      "Outlook and Microsoft 365 calendar sync for your Hacado booking website. Exchange busy time stays honest; Teams links when supported.",
    keywords: [
      "outlook calendar booking",
      "microsoft 365 appointment booking",
      "exchange calendar scheduling website",
      "hacado outlook",
    ],
    heroEyebrow: "Outlook",
    heroTitle: "Booking on your website. Busy time from Outlook.",
    heroBody:
      "Staff who live in Outlook keep Exchange as the system of record. Hacado syncs appointments and respects Outlook busy time on the public book.",
    image: "/assets/photos/desk-calendar.jpg",
    sections: [
      {
        title: "Microsoft 365 and Exchange",
        body: "Sign in with the work account the business uses. Company Entra policies may need an admin to allow Hacado first.",
      },
      {
        title: "CalDAV when you are not on Microsoft",
        body: "Fastmail, Nextcloud-style hosts, and other CalDAV servers connect with URL and credentials - same idea, different protocol.",
      },
    ],
    links: [
      { label: "Calendars & video", href: "/features/calendars-video" },
      { label: "Google Calendar lander", href: "/integrations/google-calendar" },
      { label: "All integrations", href: "/integrations" },
      { label: "Docs: Outlook", href: "https://docs.hacado.com/docs/apps/outlook" },
    ],
    cta: {
      title: "Connect Outlook",
      body: "Apps → Store → Outlook. Then set the default calendar if needed.",
    },
  },
  {
    slug: "integrations/stripe",
    seoTitle: "Stripe for Appointments & Deposits | Hacado",
    seoDescription:
      "Take Stripe deposits and payments on your Hacado booking website. Also connect Square or PayPal - the book is not locked to one processor.",
    keywords: [
      "stripe for appointments",
      "stripe booking deposits",
      "stripe salon booking",
      "hacado stripe",
    ],
    heroEyebrow: "Stripe",
    heroTitle: "Stripe for appointments on a site you own",
    heroBody:
      "Connect Stripe for deposits, balances, gift cards, and packages. Prefer Square or PayPal? Those connect too.",
    image: "/assets/generated/mock-gift-checkout.png",
    sections: [
      {
        title: "Deposits that stick",
        body: "Require a hold before long beauty appointments. Policies live on the same brand as checkout.",
      },
      {
        title: "Not a thin Square-only page",
        body: "Unlike Square Appointments, Hacado is a multi-page website first. Payments are a connection - not the whole product.",
      },
    ],
    links: [
      { label: "Booking website with Stripe", href: "/booking-website-with-stripe" },
      { label: "Payments feature", href: "/features/payments" },
      { label: "Square alternative", href: "/compare/square-appointments" },
      { label: "All integrations", href: "/integrations" },
    ],
    cta: {
      title: "Connect Stripe on Solo",
      body: "Publish free. Take money when you upgrade.",
    },
  },
  {
    slug: "integrations/zoom",
    seoTitle: "Zoom Booking Website for Coaches | Hacado",
    seoDescription:
      "Attach Zoom meetings to online appointments on your Hacado booking website. Join links in confirmations and reminders for coaches and consultants.",
    keywords: [
      "zoom booking website",
      "zoom appointment scheduling",
      "coach booking with zoom",
      "hacado zoom",
    ],
    heroEyebrow: "Zoom",
    heroTitle: "Zoom on the booking - not copied after the fact",
    heroBody:
      "When Zoom is connected and the service is online, Hacado attaches meeting details to the appointment. Reschedules refresh the link.",
    image: "/assets/generated/usecase-coach.png",
    sections: [
      {
        title: "Built for client work",
        body: "Coaches and consultants outgrow a Calendly link when they need a real site, deposits, and packages - with Zoom still in the confirmation.",
      },
      {
        title: "Meet and Teams too",
        body: "Google Meet and Microsoft Teams are available when those calendars are connected. Pick the video stack your clients already use.",
      },
    ],
    links: [
      { label: "Calendars & video", href: "/features/calendars-video" },
      { label: "Coaches use case", href: "/use-cases/coaches" },
      { label: "Calendly alternative", href: "/compare/calendly" },
      { label: "Docs: Zoom", href: "https://docs.hacado.com/docs/apps/zoom" },
    ],
    cta: {
      title: "Connect Zoom",
      body: "Apps → Store → Zoom. Finish every permission screen.",
    },
  },
  {
    slug: "integrations/sms-notifications",
    seoTitle: "SMS & Email Booking Notifications | Resend | Hacado",
    seoDescription:
      "Email and SMS booking notifications on Hacado. Confirmations and reminders as your brand - Resend for email, SMS credits on Solo and Studio.",
    keywords: [
      "sms booking notifications",
      "appointment sms reminders software",
      "resend booking email",
      "hacado sms",
    ],
    heroEyebrow: "Notifications",
    heroTitle: "Email and SMS notifications that sound like your studio",
    heroBody:
      "Confirmations and reminders go out from your booking stack. Email via Resend; SMS credits on paid plans so beauty fills get a text, not only an inbox.",
    image: "/assets/photos/phone-booking.jpg",
    sections: [
      {
        title: "Resend for email",
        body: "Transactional booking mail without bolting a separate ESP onto a marketplace listing.",
      },
      {
        title: "SMS for no-shows",
        body: "Day-before texts cut empty chairs. See SMS reminders for beauty for the persona angle.",
      },
    ],
    links: [
      { label: "Email & SMS feature", href: "/features/notifications" },
      { label: "SMS for beauty", href: "/sms-reminders-for-beauty" },
      { label: "All integrations", href: "/integrations" },
      { label: "Pricing", href: "/pricing" },
    ],
    cta: {
      title: "Turn on notifications",
      body: "Start free for email. SMS credits on Solo and Studio.",
    },
  },
  {
    slug: "integrations/google-analytics",
    seoTitle: "Google Analytics 4 for Booking Websites | Hacado",
    seoDescription:
      "Connect GA4 to your Hacado booking website. Automatic gtag on the public site, plus conversion events for bookings, waitlist, gift cards, packages, and forms.",
    keywords: [
      "google analytics booking website",
      "ga4 appointment booking",
      "google analytics salon website",
      "hacado google analytics",
    ],
    heroEyebrow: "Google Analytics",
    heroTitle: "GA4 on your booking website - without pasting a snippet",
    heroBody:
      "Connect Google Analytics 4 from the app store. Hacado injects the tag on your public site and sends visitor conversions - bookings, waitlist joins, gift cards, packages, and form submits - into GA4.",
    image: "/assets/generated/mock-booking-site.png",
    sections: [
      {
        title: "Tag without Appearance → Scripts",
        body: "Pick a web data stream (measurement ID starting with G-). The gtag loads site-wide once the app is connected - no hand-pasted snippet to maintain.",
      },
      {
        title: "Conversions that match the book",
        body: "Public bookings, waitlist joins, gift card and package purchases, and form responses map to GA4 events. Admin-created records stay out so staff actions do not inflate ads.",
      },
      {
        title: "Alongside booking tracking",
        body: "Hacado Financials shows where the booking funnel leaks. GA covers attribution and site-wide reports you already run for Instagram and Google ads.",
      },
    ],
    links: [
      { label: "Booking tracking feature", href: "/features/booking-tracking" },
      { label: "All integrations", href: "/integrations" },
      { label: "Docs: Google Analytics", href: "https://docs.hacado.com/docs/apps/google-analytics" },
      { label: "Pricing", href: "/pricing" },
    ],
    faqs: [
      {
        q: "Which plan includes Google Analytics?",
        a: "Solo and Studio. Connect it from Apps → Store.",
      },
      {
        q: "Does this replace Hacado booking tracking?",
        a: "No. Booking tracking in Financials is the in-product funnel. GA4 is for the analytics and ads stack you already use.",
      },
    ],
    cta: {
      title: "Connect Google Analytics",
      body: "Apps → Store → Google Analytics. Pick a web data stream to finish setup.",
    },
  },
];

export const allSeoLandingPages: SeoLandingPage[] = [
  ...categoryHubPages,
  ...migrationGuidePages,
  ...featurePersonaPages,
  ...integrationLandingPages,
];

export function seoLandingAlternativeRedirects() {
  return allSeoLandingPages.flatMap((p) =>
    (p.alternativeSlugs ?? []).map((from) => ({
      from,
      to: `/${p.slug}`,
      title: p.seoTitle,
      description: p.seoDescription,
    })),
  );
}

export function seoLandingBySlug(slug: string) {
  return allSeoLandingPages.find((p) => p.slug === slug);
}
