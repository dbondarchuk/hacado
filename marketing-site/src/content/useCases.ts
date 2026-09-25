export type UseCase = {
  slug: string;
  title: string;
  persona: string;
  cluster: "beauty" | "other";
  summary: string;
  problem: string;
  outcome: string;
  image: string;
  gallery: string[];
  bullets: string[];
  sections: { title: string; body: string }[];
  steps: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
  related: { label: string; href: string }[];
};

export const useCases: UseCase[] = [
  {
    slug: "nail-artists",
    title: "For nail artists",
    persona: "Solo nail techs",
    cluster: "beauty",
    summary:
      "Stop booking from Instagram DMs. Your page takes deposits, fills, gift cards, and the next set - while you are still at the table.",
    problem:
      "DMs, screenshots of your grid, and “are you free Saturday?” eat the time you should spend on sets. No-shows still happen because nothing was paid. Fills drift because nobody got a reminder at week two.",
    outcome:
      "Clients pick gel vs acrylic, add art, pay a deposit, and get an SMS the day before. Gift cards sell on the site for birthdays. You keep the relationship - not a marketplace sending them to the next studio.",
    image: "/assets/generated/usecase-nails.png",
    gallery: [
      "/assets/photos/nails-closeup.jpg",
      "/assets/photos/nails-studio.jpg",
      "/assets/generated/mock-booking-site.png",
    ],
    bullets: [
      "Service menu with add-ons (art, paraffin, soak-off)",
      "Deposits so the chair stays booked",
      "Gift cards designed and sold on your website",
      "SMS before fills every 2–3 weeks",
      "Gallery pages next to the book button",
      "Waitlist when Saturdays are gone",
    ],
    sections: [
      {
        title: "The menu has to be as specific as your work",
        body: "Gel, acrylic, builder, fills vs full sets, art as add-ons - clients stop guessing in DMs when duration and price are on the page. Duplicate-booking checks can warn someone who already has a fill on the books this cycle.",
      },
      {
        title: "Revenue between appointments",
        body: "A branded gift card on your site is how friends buy for birthdays without you handwriting a voucher. Seasonal discounts (holiday sets, slow Tuesdays) can be limited to named services so you are not discounting everything. Packages work if you sell a bundle of fills.",
      },
      {
        title: "Your book, not a directory",
        body: "Hacado is not Booksy or Fresha. There is no marketplace commission and no “similar artists nearby.” Instagram, Google, and word of mouth bring people; the site converts them.",
      },
    ],
    steps: [
      {
        title: "List your sets",
        body: "Gel, acrylic, builder - with duration, price, and add-ons.",
      },
      {
        title: "Ask for a deposit",
        body: "Card on file before they take a Saturday slot.",
      },
      {
        title: "Share one link",
        body: "Instagram bio, Google, and your cards - plus a gift card page.",
      },
    ],
    faqs: [
      {
        q: "Can I show my work?",
        a: "Yes. Add gallery pages next to booking so the site is your portfolio, not only a calendar.",
      },
      {
        q: "Do I need a marketplace to get clients?",
        a: "No. Hacado does not list you in a directory. You bring demand; we run the book and the site.",
      },
      {
        q: "Can I sell gift cards for sets?",
        a: "Yes. Design the card in Gift Card Studio and sell it on your website with Stripe, Square, or PayPal.",
      },
      {
        q: "How do fills get rebooked?",
        a: "Reminders timed to your fill cycle, plus a waitlist when you are booked out. Clients can also rebook from the confirmation or cabinet.",
      },
      {
        q: "I work from home / a suite - is this still right?",
        a: "Yes. The page is yours. You do not share a salon’s booking tool or their brand.",
      },
      {
        q: "What if I add a second tech later?",
        a: "Start on Solo. Studio adds seats, per-person calendars, and “book a person or next available.”",
      },
    ],
    related: [
      { label: "Gift cards", href: "/features/gift-cards" },
      { label: "Scheduling", href: "/features/scheduling" },
      { label: "Payments", href: "/features/payments" },
    ],
  },
  {
    slug: "hair-stylists",
    title: "For hair stylists & barbers",
    persona: "Chair renters and solo stylists",
    cluster: "beauty",
    summary:
      "Color, cut, and add-ons without a front desk answering the phone - even if you rent the chair.",
    problem:
      "You are mid-foil when the phone rings. Voicemail fills up. Chair renters cannot share the salon’s booking tool, so clients still text you personally. Color appointments are long; a no-show wrecks the day.",
    outcome:
      "Your own branded page, your hours, your add-ons. Clients book a cut + gloss in one visit. Personal calendar sync keeps days off blocked. You look like a studio even if you rent a chair.",
    image: "/assets/generated/usecase-hair.png",
    gallery: [
      "/assets/photos/hair-salon.jpg",
      "/assets/photos/hair-cut.jpg",
      "/assets/photos/barber.jpg",
    ],
    bullets: [
      "Services with different durations (cut vs color vs treatment)",
      "Add-ons at checkout (treatment, bang trim, beard)",
      "Your domain on Solo - not the salon’s link",
      "Calendar sync with Google, Outlook, CalDAV, or ICS import",
      "Deposits on long color blocks",
      "Team calendars if you grow into a second chair",
    ],
    sections: [
      {
        title: "Chair rental should still look like your business",
        body: "Hacado is your page, not the salon’s. Share your own link, take your own deposits, keep your own client list. When you leave the suite, the book comes with you.",
      },
      {
        title: "Long services need honest availability",
        body: "Buffers after color, lunch blocks, and personal events from Google or an ICS feed from another job all keep the public page honest. Clients see a 90-minute color as 90 minutes, not a mystery gap.",
      },
      {
        title: "If the floor grows",
        body: "Studio seats give each stylist a calendar. Clients pick their person or the next opening. Eligible staff on a service means a barber does not show up as a balayage option.",
      },
    ],
    steps: [
      {
        title: "Put the menu online",
        body: "Cut, color, treatment - clients see time and price.",
      },
      {
        title: "Connect calendar",
        body: "Days off and personal events stay blocked.",
      },
      {
        title: "Send reminders",
        body: "Fewer no-shows on Saturday color appointments.",
      },
    ],
    faqs: [
      {
        q: "I rent a chair - does this work?",
        a: "Yes. Hacado is your page, not the salon’s. Share your own link and keep your clients.",
      },
      {
        q: "Can I offer add-ons like a gloss or beard?",
        a: "Yes. Add-ons sit on the service so checkout matches what you actually do.",
      },
      {
        q: "What if I also work another job?",
        a: "Import that calendar as an ICS feed or connect Google/Outlook so those hours are busy in Hacado.",
      },
      {
        q: "Can the salon book me too?",
        a: "They can use your public link, or you can add appointments by hand. Studio is for a shared brand with multiple logins.",
      },
      {
        q: "Gift cards for hair?",
        a: "Design and sell them on your site - useful for holidays without the salon’s gift-card program.",
      },
      {
        q: "Barbers too?",
        a: "Yes. Shorter services, walk-ins added by hand, same deposits and reminders.",
      },
    ],
    related: [
      { label: "Staff management", href: "/features/team" },
      { label: "Appointment management", href: "/features/appointments" },
      { label: "Calendars", href: "/features/calendars-video" },
    ],
  },
  {
    slug: "tattoo-artists",
    title: "For tattoo artists",
    persona: "Private studios and guest spots",
    cluster: "beauty",
    summary:
      "Consults, deposits, portfolio, and aftercare - without the inbox chaos.",
    problem:
      "Flash interest, consults, and “how much for a sleeve?” live in three apps. Deposits are awkward to chase. Aftercare is a copied paste. Guest spots scramble a second calendar.",
    outcome:
      "A consult slot with a deposit, a portfolio on your site, and an SMS after the session. Guest-spot days are just another busy block or a second set of hours. You own the client list.",
    image: "/assets/generated/usecase-tattoo.png",
    gallery: [
      "/assets/photos/tattoo-flash.jpg",
      "/assets/generated/usecase-tattoo.png",
      "/assets/generated/mock-gift-checkout.png",
    ],
    bullets: [
      "Consult vs session as separate services",
      "Deposits before drawing time",
      "Portfolio pages on your own domain",
      "Aftercare SMS when they leave the chair",
      "Intake for placement, references, and health notes",
      "ICS or Google sync for guest-spot calendars",
    ],
    sections: [
      {
        title: "Split the work the way you already think",
        body: "Consults are short and cheap (or a deposit toward the piece). Sessions are long and prepaid enough that a no-show hurts less. Different durations, different payment rules, same customer when they come back for the next sitting.",
      },
      {
        title: "The site is the flash wall",
        body: "Galleries and about pages sit next to booking. People who found you on Instagram land somewhere that looks like a studio, not a scheduler widget. Gift cards work for people who want to gift a session without picking the design.",
      },
      {
        title: "Aftercare should not depend on you remembering",
        body: "A follow-up template goes out after the appointment. Intake forms collect what you need before they sit down. Auto-matched customers mean sitting two and sitting five are the same person in the book.",
      },
    ],
    steps: [
      {
        title: "Split consult and tattoo",
        body: "Different length, different deposit.",
      },
      {
        title: "Show the work",
        body: "Gallery pages next to the book button.",
      },
      { title: "Follow up once", body: "Aftercare goes out automatically." },
    ],
    faqs: [
      {
        q: "Is this a directory like Booksy?",
        a: "No. There is no marketplace taking a cut or sending clients to the next shop. It is your site.",
      },
      {
        q: "Can I take a deposit on the consult?",
        a: "Yes. Set deposit or full pay per service. Apply it toward the session however you already do in person.",
      },
      {
        q: "Guest spots / conventions?",
        a: "Block those days as busy, import another calendar via ICS, or temporarily change hours. You are not maintaining two booking products.",
      },
      {
        q: "Portfolio without Instagram-only?",
        a: "Host galleries on your Hacado site and use your own domain on Solo.",
      },
      {
        q: "Health / consent forms?",
        a: "Intake forms on Solo collect answers before the visit. Keep legal review of what you store.",
      },
      {
        q: "Can a shop with several artists use this?",
        a: "Studio: seats, per-artist calendars, clients pick who they want.",
      },
    ],
    related: [
      { label: "Payments", href: "/features/payments" },
      { label: "Notifications", href: "/features/notifications" },
      { label: "Client management", href: "/features/clients" },
    ],
  },
  {
    slug: "lash-and-brow",
    title: "For lash & brow techs",
    persona: "Lash and brow specialists",
    cluster: "beauty",
    summary:
      "Fills on a 2–3 week cadence, waitlist when you are booked out, intake before they lie down.",
    problem:
      "Classic vs volume, fills vs full sets - clients guess. Your books close and you still get DMs. No-shows wreck a lash day. Patch-test notes live in a camera roll.",
    outcome:
      "Clear services, a waitlist, and reminders timed to the fill cycle. They rebook before they leave, or from the SMS later. Intake sits on the customer, not in your photos.",
    image: "/assets/generated/usecase-lash.png",
    gallery: [
      "/assets/photos/makeup-lashes.jpg",
      "/assets/photos/brow-beauty.jpg",
      "/assets/generated/usecase-lash.png",
    ],
    bullets: [
      "Classic, volume, hybrid, and fill as distinct services",
      "Waitlist when Saturdays are gone",
      "SMS timed to a 2–3 week fill",
      "Intake for adhesives, allergies, and aftercare",
      "Packages of fills if you sell a series",
      "Discounts aimed at new sets or slow weekdays",
    ],
    sections: [
      {
        title: "Cadence is the business",
        body: "Fills are a rhythm. Reminders and “schedule again” from the last visit keep that rhythm without you chasing. Duplicate checks can catch someone booking a full set on top of a fill that is still on the calendar.",
      },
      {
        title: "Intake before they are on the bed",
        body: "Forms collect patch-test notes, adhesive sensitivities, and aftercare acknowledgements. If they already booked before, auto-match attaches the answers to the same customer.",
      },
      {
        title: "Sell the next three fills now",
        body: "Prepaid packages turn a loyal fill client into credit on the books. Gift cards cover first-time full sets as presents. A weekday discount can be limited to classic fills so you are not marking down volume Saturdays.",
      },
    ],
    steps: [
      {
        title: "Name the sets",
        body: "So clients stop asking “what’s a fill?”",
      },
      { title: "Open a waitlist", body: "Cancellations ping the next person." },
      {
        title: "Automate the nudge",
        body: "Fill reminder before lashes grow out.",
      },
    ],
    faqs: [
      {
        q: "Can I require a patch test note?",
        a: "Use an intake form on Solo to collect allergies and previous reactions before they sit down.",
      },
      {
        q: "How do I handle booked-out weeks?",
        a: "Waitlist on Solo. When a slot opens, the next person can be notified instead of you screenshotting the calendar into a group chat.",
      },
      {
        q: "Packages of fills?",
        a: "Yes - a prepaid count of a fill service, optional expiry, sold on the site or at the desk.",
      },
      {
        q: "Brow lamination vs lashes on one site?",
        a: "Separate services, maybe separate staff on Studio if you have a brow specialist.",
      },
      {
        q: "Do I need Instagram booking apps?",
        a: "One Hacado link in bio is enough. The site is the menu, the book, and the gift card shop.",
      },
      {
        q: "What about no-shows on lash days?",
        a: "Deposits, reminders, and a cancel window. Policies live on the site so they are not a surprise.",
      },
    ],
    related: [
      { label: "Packages", href: "/features/packages" },
      { label: "Discounts", href: "/features/discounts" },
      { label: "Notifications", href: "/features/notifications" },
    ],
  },
  {
    slug: "salons-clinics",
    title: "For salons & clinics",
    persona: "Teams on Studio",
    cluster: "other",
    summary:
      "Several practitioners, several calendars, one branded site - not a front-desk bottleneck.",
    problem:
      "Front desk is the bottleneck. Each specialist has different hours. Clients want “anyone free” or a favorite. Personal phones become the reminder system. New hires mean another login nobody set up.",
    outcome:
      "Studio plan: seats, per-person calendars, shared waitlist and SMS. Eligible staff on each service. Your site still looks like one brand. Extra seats from $4/month when the roster grows.",
    image: "/assets/generated/usecase-salon.png",
    gallery: [
      "/assets/generated/usecase-salon.png",
      "/assets/photos/hair-salon.jpg",
      "/assets/photos/nails-studio.jpg",
    ],
    bullets: [
      "5 team members included on Studio",
      "Extra seats from $4/month",
      "Individual calendars per specialist",
      "Book a person or next available",
      "300 SMS credits each month",
      "One customer list the whole floor can search",
    ],
    sections: [
      {
        title: "This is not only a salon product",
        body: "The same seat model fits a med-spa, a physio clinic, a tutoring centre, or a coaching practice with associates. Anyone who sells time through more than one calendar can share a site without sharing a password.",
      },
      {
        title: "Front desk without being the database",
        body: "Search customers by name, email, or phone. History, packages, and gift cards are on the person. Hand-add walk-ins. Payments auto-match when Square or PayPal records line up with a visit.",
      },
      {
        title: "Hiring should not mean a new scheduler",
        body: "Invite by email, assign a role, set hours and eligible services. When someone leaves, their seat frees. You are not exporting a Booksy roster into a spreadsheet.",
      },
    ],
    steps: [
      {
        title: "Add the team",
        body: "Each person gets hours that match their chair or room.",
      },
      {
        title: "One public site",
        body: "Clients pick a person or the next opening.",
      },
      {
        title: "Share reminders",
        body: "The front desk is not texting from a personal phone.",
      },
    ],
    faqs: [
      {
        q: "We are two people - Solo or Studio?",
        a: "Solo is one business owner scaling services. Studio is for multiple people with their own calendars and logins.",
      },
      {
        q: "Does this work outside beauty?",
        a: "Yes. Clinics, wellness rooms, coaching teams, and lesson studios use the same seats, services, and site.",
      },
      {
        q: "Can we limit who does injectables vs facials?",
        a: "Eligible staff on the service (and on packages) so the wrong practitioner never appears as available.",
      },
      {
        q: "What if we outgrow five people?",
        a: "Buy additional seats from Team settings. They bill with Studio.",
      },
      {
        q: "Shared waitlist?",
        a: "Waitlist is a workspace feature - useful when the whole floor is slammed, not only one person.",
      },
      {
        q: "Who owns the client list?",
        a: "The workspace. There is no marketplace. Export and privacy obligations are yours as the business.",
      },
    ],
    related: [
      { label: "Staff management", href: "/features/team" },
      { label: "Appointment management", href: "/features/appointments" },
      { label: "Client management", href: "/features/clients" },
    ],
  },
  {
    slug: "coaches",
    title: "For coaches",
    persona: "Calendly is for meetings. Hacado is for businesses.",
    cluster: "other",
    summary:
      "Calendly schedules meetings. You run a practice - deposits, packages, SMS, a real site, and video that creates itself.",
    problem:
      "A Calendly link is not a business. You still need a website, invoices, Zoom copy-paste, and something that looks like your practice. Discovery calls no-show. Packages of sessions live in a spreadsheet.",
    outcome:
      "Automatic Zoom, Meet, or Teams, a branded site, and payment to confirm the session. Session packages and seasonal offers sit on the same page as the book button.",
    image: "/assets/generated/usecase-coach.png",
    gallery: [
      "/assets/photos/coach-laptop.jpg",
      "/assets/generated/usecase-coach.png",
      "/assets/logos/zoom.svg",
    ],
    bullets: [
      "Zoom, Google Meet, and Microsoft Teams created for you",
      "Full website, not only a booking link",
      "Deposits to confirm discovery calls",
      "Prepaid packages of sessions",
      "Time zones for clients who are not in your city",
      "Email reminders 24 hours before",
    ],
    sections: [
      {
        title: "A practice is more than a calendar round-robin",
        body: "About, testimonials, FAQ, and booking on one domain. That is the gap Calendly leaves on purpose. If you already have a site and only need a meeting link, stay there. If the “stack” is Calendly + Carrd + Stripe links + Zoom, Hacado is the consolidation.",
      },
      {
        title: "Paid time should be prepaid when it matters",
        body: "Discovery might be a small deposit. A 12-week container is a package with N sessions and an expiry. Discounts can open a January cohort without changing your list price forever.",
      },
      {
        title: "Busy time from the rest of life",
        body: "Google, Outlook, CalDAV, or an ICS feed from another tool so you are not bookable during a day job or a school calendar. Video links update when the session moves.",
      },
    ],
    steps: [
      {
        title: "Connect video",
        body: "Zoom, Meet, or Teams links go in the confirmation.",
      },
      {
        title: "Require payment",
        body: "No more no-show intro calls unless you choose that.",
      },
      {
        title: "Publish the practice",
        body: "About, testimonials, packages, and book - one domain.",
      },
    ],
    faqs: [
      {
        q: "Why not stay on Calendly?",
        a: "If you only need a meeting link, Calendly is fine. If you want the website, SMS, packages, gift cards, and policies together, Hacado is built for that.",
      },
      {
        q: "Do I have to be in beauty?",
        a: "No. Coaches, consultants, and practitioners are a first-class audience. The product started in a studio; it is not limited to one.",
      },
      {
        q: "Group programs?",
        a: "Hacado is appointment-based (one slot, one client or a staff assignment). If you only sell cohorts with no 1:1 bookable time, a course platform may still fit better.",
      },
      {
        q: "Packages of calls?",
        a: "Yes - prepaid session counts against a service, sold on the site or issued by you.",
      },
      {
        q: "International clients?",
        a: "Time zones are handled. PayPal or Stripe for people who prefer those rails.",
      },
      {
        q: "Associates in my practice?",
        a: "Studio seats: each coach has hours; clients pick a person.",
      },
    ],
    related: [
      { label: "Calendars & video", href: "/features/calendars-video" },
      { label: "Packages", href: "/features/packages" },
      { label: "Compare vs Calendly", href: "/compare/calendly" },
    ],
  },
  {
    slug: "tutors-freelancers",
    title: "For tutors",
    persona: "Lessons, not meeting links",
    cluster: "other",
    summary:
      "A simple site, calendar sync, and confirmations - without a salon platform or a pile of school-admin tools.",
    problem:
      "Parents message at 10pm. Recurring lessons collide with your other job. You do not want a heavy salon product, but Calendly does not look like a teaching practice and does not take lesson packages cleanly.",
    outcome:
      "Hours online, email confirmations, reschedule rules. Lesson types with real durations. Grow into payments and prepaid lesson packs when invoicing gets old. ICS import keeps a school timetable off the book.",
    image: "/assets/generated/usecase-tutor.png",
    gallery: [
      "/assets/generated/usecase-tutor.png",
      "/assets/photos/desk-calendar.jpg",
      "/assets/photos/coach-laptop.jpg",
    ],
    bullets: [
      "Lesson types with different lengths (30 / 45 / 60)",
      "Google, Outlook, CalDAV, or ICS busy-time import",
      "Email confirmations included on Free",
      "Prepaid lesson packages on Solo",
      "Video links for remote lessons",
      "A real page for parents to bookmark",
    ],
    sections: [
      {
        title: "Start smaller than a studio stack",
        body: "Free is enough to try: one service, 15 appointments a cycle, a branded page, email. When families pay you regularly, Solo adds checkout and packages (a term of ten lessons) so you are not chasing transfers.",
      },
      {
        title: "Two calendars is the normal case",
        body: "School, a day job, or another freelance book should block Hacado. Paste an ICS feed or connect the calendar you already live in. Parents only see times you can actually teach.",
      },
      {
        title: "Not a classroom LMS",
        body: "Hacado schedules people and takes payment. It is not homework, grading, or a student portal. If that is the job, keep the LMS and use Hacado for 1:1 booking only.",
      },
    ],
    steps: [
      {
        title: "Set lesson types",
        body: "30 / 45 / 60 minutes - or consult vs ongoing.",
      },
      {
        title: "Share with parents",
        body: "One link instead of a group chat.",
      },
      {
        title: "Upgrade when ready",
        body: "Payments and packages when you outgrow invoicing.",
      },
    ],
    faqs: [
      {
        q: "Can I start on Free?",
        a: "Yes. 15 appointments per cycle, one service, up to 10 pages - enough to try the flow with a few families.",
      },
      {
        q: "Is this for beauty?",
        a: "No. Tutors, music teachers, freelance specialists, and anyone selling sessions use the same scheduling and site.",
      },
      {
        q: "Recurring weekly lessons?",
        a: "Clients rebook, or you add the next visit from the last appointment. Packages prepay a count of lessons.",
      },
      {
        q: "Parents paying for kids?",
        a: "The customer record is whoever books (often the parent). Gift cards and packages still attach to that profile.",
      },
      {
        q: "Online lessons?",
        a: "Connect Zoom, Meet, or Teams the same way coaches do.",
      },
      {
        q: "Multiple tutors in a centre?",
        a: "Studio seats and per-person calendars.",
      },
    ],
    related: [
      { label: "Scheduling", href: "/features/scheduling" },
      { label: "Packages", href: "/features/packages" },
      { label: "Calendars & video", href: "/features/calendars-video" },
      { label: "Compare vs Calendly", href: "/compare/calendly" },
    ],
  },
  {
    slug: "consultants",
    title: "For consultants",
    persona: "Client work, not standups",
    cluster: "other",
    summary:
      "Calendly books meetings. Consultants sell paid time - discovery deposits, project kickoffs, and a site that looks like the practice.",
    problem:
      "Your Calendly is full of tire-kickers. Proposals live in email. There is no branded page for referrals. Zoom links are still manual. You look like a meeting tool, not a firm.",
    outcome:
      "A public site with services, deposits on intros, packages for retainers-as-sessions, automatic video, and SMS the day before. Clients book business with you - not a free calendar slot.",
    image: "/assets/photos/coach-laptop.jpg",
    gallery: [
      "/assets/photos/coach-laptop.jpg",
      "/assets/generated/usecase-coach.png",
      "/assets/generated/mock-booking-site.png",
    ],
    bullets: [
      "Discovery vs delivery as separate services",
      "Deposits so intros are serious",
      "Branded site and custom domain",
      "Zoom / Meet / Teams without copy-paste",
      "Prepaid packs of advisory hours",
      "Client cabinet for upcoming sessions",
    ],
    sections: [
      {
        title: "Meetings are free. Engagements are not.",
        body: "Calendly optimizes for anyone grabbing a slot. Hacado optimizes for paid client work: price on the page, deposit at checkout, reminders that protect your week.",
      },
      {
        title: "The site is the pitch deck that books",
        body: "About, case-style pages, FAQ, and book on one domain. Referrals land somewhere that looks like you - not a generic scheduler skin.",
      },
      {
        title: "Busy time from the rest of the firm",
        body: "Connect Google or Outlook so partner meetings and delivery work block public availability. Clients only see hours you can actually sell.",
      },
    ],
    steps: [
      {
        title: "Split the menu",
        body: "Discovery, audit, ongoing - with real durations and prices.",
      },
      {
        title: "Require a deposit",
        body: "Tire-kickers bounce before they burn the hour.",
      },
      {
        title: "Share one URL",
        body: "LinkedIn, email signature, proposal footer.",
      },
    ],
    faqs: [
      {
        q: "Why not stay on Calendly?",
        a: "If you only need round-robin internals, stay. If clients pay for your time, you need deposits, a site, and reminders - that is Hacado.",
      },
      {
        q: "Retainers?",
        a: "Model them as prepaid packages of sessions, or book recurring visits from the last appointment.",
      },
      {
        q: "Associates?",
        a: "Studio seats: each consultant has hours; clients pick a person.",
      },
    ],
    related: [
      { label: "Compare vs Calendly", href: "/compare/calendly" },
      { label: "Payments", href: "/features/payments" },
      { label: "Packages", href: "/features/packages" },
    ],
  },
  {
    slug: "personal-trainers",
    title: "For personal trainers",
    persona: "Sessions that get paid",
    cluster: "other",
    summary:
      "Packs of sessions, no-show protection, and a page clients bookmark - not a gym marketplace or a naked Calendly link.",
    problem:
      "Clients text to reschedule. Session packs live in Notes. The gym’s app is not your brand. A free Calendly link trains people to treat your time like a lobby meeting.",
    outcome:
      "Service menu for intro, 1:1, and partner sessions. Prepaid packages. Deposits. SMS before the block. Your site - even if you train on someone else’s floor.",
    image: "/assets/photos/coach-laptop.jpg",
    gallery: [
      "/assets/photos/coach-laptop.jpg",
      "/assets/generated/mock-sms-phone.png",
      "/assets/photos/phone-booking.jpg",
    ],
    bullets: [
      "Intro assess vs ongoing sessions",
      "Prepaid session packages",
      "Deposits on first bookings",
      "SMS reminders",
      "Your brand, not the gym’s booking tool",
      "Waitlist when mornings are full",
    ],
    sections: [
      {
        title: "Packs belong in the product",
        body: "Ten sessions with an expiry beats a spreadsheet. Clients buy on your site; each booking burns a credit.",
      },
      {
        title: "Calendly trains the wrong habit",
        body: "Meeting tools make time feel free. Trainers sell blocks. Put price and deposit on the page so the book stays honest.",
      },
      {
        title: "Train where you train - brand stays yours",
        body: "Chair-rental logic for trainers: the floor is borrowed, the client list and the link are not.",
      },
    ],
    steps: [
      { title: "List session types", body: "Intro, 30, 60 - with prices." },
      { title: "Sell a pack", body: "Prepaid credits on Solo." },
      { title: "Remind them", body: "SMS the night before so the rack is not empty." },
    ],
    faqs: [
      {
        q: "Gym already has an app?",
        a: "Keep training there if you must. Use Hacado for private clients who book you directly.",
      },
      {
        q: "Outdoor / park sessions?",
        a: "Same booking flow. Put the meetup note in the service or confirmation.",
      },
      {
        q: "Compare to Calendly?",
        a: "Calendly will not sell packs or look like a training business. See the Calendly alternative page.",
      },
    ],
    related: [
      { label: "Packages", href: "/features/packages" },
      { label: "Notifications", href: "/features/notifications" },
      { label: "Compare vs Calendly", href: "/compare/calendly" },
    ],
  },
  {
    slug: "photographers",
    title: "For photographers",
    persona: "Shoots with deposits",
    cluster: "other",
    summary:
      "Mini-sessions, retainers, and galleries next to a book button - without a meeting link that underprices the shoot.",
    problem:
      "Inquiries flood DMs. Mini-session days become a spreadsheet. Calendly cannot sell a package of looks or take a deposit that protects the kit day.",
    outcome:
      "Service types for mini, portrait, event. Deposits. A site with portfolio pages. Clients pick a slot that already has a price.",
    image: "/assets/generated/hero-workspace.png",
    gallery: [
      "/assets/generated/hero-workspace.png",
      "/assets/generated/mock-booking-site.png",
      "/assets/photos/phone-booking.jpg",
    ],
    bullets: [
      "Mini-session blocks with real duration",
      "Deposits before the shoot day",
      "Portfolio pages in the same builder",
      "Gift cards for session vouchers",
      "SMS and email reminders",
      "Your domain on Solo",
    ],
    sections: [
      {
        title: "A shoot is not a 30-minute meeting",
        body: "Buffers for travel and edit time. Duration that matches the offering. Calendly-style free booking trains clients to ghost; deposits do not.",
      },
      {
        title: "The portfolio is the funnel",
        body: "Gallery pages sit next to book. One brand - not Instagram bio → Calendly → Venmo.",
      },
      {
        title: "Gift the session",
        body: "Branded gift cards for portraits sell on the site for holidays without handwritten vouchers.",
      },
    ],
    steps: [
      { title: "Define shoot types", body: "Mini, family, brand - with deposits." },
      { title: "Publish the gallery", body: "Work next to the book button." },
      { title: "Open the calendar", body: "Only the windows you can shoot." },
    ],
    faqs: [
      {
        q: "Multi-hour events?",
        a: "Create a longer service duration and buffers. Or book by hand after a consult.",
      },
      {
        q: "Second shooter?",
        a: "Studio seats if they need their own login and calendar.",
      },
      {
        q: "Why not Calendly?",
        a: "No portfolio site, weak deposits story, no gift cards. See Compare vs Calendly.",
      },
    ],
    related: [
      { label: "Website builder", href: "/features/website-builder" },
      { label: "Gift cards", href: "/features/gift-cards" },
      { label: "Compare vs Calendly", href: "/compare/calendly" },
    ],
  },
  {
    slug: "therapists",
    title: "For therapists & wellness practitioners",
    persona: "Private practice booking",
    cluster: "other",
    summary:
      "A calm branded book with reminders and clear policies - without a marketplace listing your practice next to competitors.",
    problem:
      "Phone tag fills the week. No-shows hurt. Directory sites share your clients. A naked scheduler looks unprofessional for clinical or wellness work.",
    outcome:
      "Intake-friendly booking on your site, email and SMS reminders, cancel windows you set, and a client list that stays in your workspace - not a marketplace.",
    image: "/assets/photos/brow-beauty.jpg",
    gallery: [
      "/assets/photos/brow-beauty.jpg",
      "/assets/photos/desk-calendar.jpg",
      "/assets/generated/mock-booking-site.png",
    ],
    bullets: [
      "Session types with honest durations",
      "Cancel / reschedule windows",
      "Email + SMS reminders",
      "Your domain and brand",
      "No marketplace directory",
      "Client history in one profile",
    ],
    sections: [
      {
        title: "Privacy of brand matters",
        body: "Clients should remember your practice name - not a directory. Hacado has no marketplace sending them to the next listing.",
      },
      {
        title: "Policies on the page",
        body: "Cancel windows and deposits (where appropriate) live next to booking so Saturday changes are a setting, not an argument.",
      },
      {
        title: "Not a clinical EHR",
        body: "Hacado schedules and messages. Charting and insurance stay in the tools you already use for care.",
      },
    ],
    steps: [
      { title: "Publish hours", body: "Weekly availability clients can trust." },
      { title: "Set policies", body: "How far ahead they may cancel or move." },
      { title: "Turn on reminders", body: "Fewer empty chairs." },
    ],
    faqs: [
      {
        q: "HIPAA / clinical records?",
        a: "Use your clinical system for charts. Hacado is the booking website and reminders layer.",
      },
      {
        q: "Group practice?",
        a: "Studio seats and per-practitioner calendars.",
      },
      {
        q: "Directories?",
        a: "We do not run one. Keep Psychology Today or similar for discovery if you want; book on Hacado.",
      },
    ],
    related: [
      { label: "Scheduling", href: "/features/scheduling" },
      { label: "Client management", href: "/features/clients" },
      { label: "Compare vs Fresha", href: "/compare/fresha" },
    ],
  },
  {
    slug: "freelancers",
    title: "For freelancers",
    persona: "Paid sessions on your brand",
    cluster: "other",
    summary:
      "Consults, critiques, and office hours with a real page and checkout - Calendly is for meetings; you sell work.",
    problem:
      "Every inquiry starts in DMs. You paste a Calendly link that looks like every other freelancer. Getting paid is a separate Venmo chase. No portfolio next to the book button.",
    outcome:
      "Services with prices, deposits, optional packages, a branded page, and automatic video when the session is remote.",
    image: "/assets/generated/usecase-newbiz.png",
    gallery: [
      "/assets/generated/usecase-newbiz.png",
      "/assets/photos/desk-calendar.jpg",
      "/assets/generated/mock-gift-checkout.png",
    ],
    bullets: [
      "Priced session types on a real site",
      "Deposits at booking",
      "Custom domain on Solo",
      "Video links for remote work",
      "Gift cards / packages when it fits",
      "One link in the bio",
    ],
    sections: [
      {
        title: "Calendly is for meetings. You sell deliverables-adjacent time.",
        body: "Strategy calls, portfolio reviews, pairing sessions - they need a brand and a payment, not a free round-robin slot.",
      },
      {
        title: "Stop the Venmo epilogue",
        body: "Checkout on Solo. The confirmation is the receipt. The calendar is already blocked.",
      },
      {
        title: "Day-job calendar stays sacred",
        body: "ICS or Google sync so public freelancing hours never overlap the W-2 week.",
      },
    ],
    steps: [
      { title: "Name the offer", body: "What they buy, how long, how much." },
      { title: "Publish the page", body: "Bio link becomes a real site." },
      { title: "Take payment", body: "Deposit or full - your rule." },
    ],
    faqs: [
      {
        q: "Just starting?",
        a: "Free covers a branded page and limited appointments. Solo when money matters.",
      },
      {
        q: "Agencies with several freelancers?",
        a: "Studio seats if each person needs a login and calendar.",
      },
      {
        q: "Vs Calendly?",
        a: "See the Calendly alternative - meetings vs businesses.",
      },
    ],
    related: [
      { label: "Compare vs Calendly", href: "/compare/calendly" },
      { label: "Website builder", href: "/features/website-builder" },
      { label: "Payments", href: "/features/payments" },
    ],
  },
  {
    slug: "new-businesses",
    title: "For businesses without a website",
    persona: "Starting from zero",
    cluster: "other",
    summary:
      "Skip the website builder + scheduler + SMS stack. Open with one product - whatever you sell, as long as it is time.",
    problem:
      "You were going to buy Squarespace, then Calendly, then a texting app. Launch slips another month. You might be a studio, a practice, a tutor, or a consultant - the stack is the same mess.",
    outcome:
      "A live booking website on yourbusiness.hacado.me the same afternoon. Add a custom domain, payments, gift cards, and team seats when the book actually needs them - not on day one.",
    image: "/assets/generated/usecase-newbiz.png",
    gallery: [
      "/assets/generated/usecase-newbiz.png",
      "/assets/generated/hero-workspace.png",
      "/assets/photos/phone-booking.jpg",
    ],
    bullets: [
      "No separate hosting or theme shop",
      "Pages + booking + email in one admin",
      "Free subdomain to start",
      "Custom domain later on Solo",
      "Grow into payments, gift cards, packages, team",
      "Works for studios, practices, lessons, and consults",
    ],
    sections: [
      {
        title: "Launch is a page, not a vendor list",
        body: "Setup asks what you do and when you are free. You pick colors and a logo. You publish. That path is the same whether the first client is a manicure, a consult, or a piano lesson.",
      },
      {
        title: "Pay for complexity when you have it",
        body: "Free proves the flow. Solo is deposits, domain, gift cards, discounts, packages. Studio is multiple people. You do not buy the salon suite on week one.",
      },
      {
        title: "Keep the list from day one",
        body: "Every booking auto-matches a customer. When you add SMS or a second staff member later, history is already there. You are not migrating a Google Sheet in six months.",
      },
    ],
    steps: [
      { title: "Tell us what you do", body: "About two minutes in setup." },
      { title: "Make it yours", body: "Logo, colors, a welcome line." },
      {
        title: "Share the link",
        body: "Instagram, Google Business Profile, or a paper card.",
      },
    ],
    faqs: [
      {
        q: "Is the free subdomain yours?",
        a: "yourbusiness.hacado.me is included. Bring your own domain on Solo or Studio.",
      },
      {
        q: "Do I have to be a nail tech?",
        a: "No. The first Hacado customer was a nail studio. The product is for anyone opening a book - beauty, wellness, coaching, lessons, clinics.",
      },
      {
        q: "Can I migrate later if I outgrow it?",
        a: "You own the client records in your workspace. Custom domain stays yours. There is no marketplace lock-in.",
      },
      {
        q: "What if I already bought a Squarespace?",
        a: "Keep it if you want; point a Book button at Hacado, or move pages across when you are ready.",
      },
      {
        q: "How fast to first booking?",
        a: "Same day is normal if you know your hours and services. Payments can wait until Solo.",
      },
      {
        q: "Do I need a designer?",
        a: "No. Drag and drop. Hire a designer later for photos if you want - the builder will not block launch.",
      },
    ],
    related: [
      { label: "Website builder", href: "/features/website-builder" },
      { label: "Booking tracking", href: "/features/booking-tracking" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
];

export function useCaseBySlug(slug: string) {
  return useCases.find((u) => u.slug === slug);
}
