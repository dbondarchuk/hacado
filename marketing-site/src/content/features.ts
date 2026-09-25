import { marketingVideos } from "./videos";

export type FeatureIcon =
  | "calendar"
  | "globe"
  | "card"
  | "bell"
  | "video"
  | "gift"
  | "users"
  | "percent"
  | "package"
  | "user"
  | "chart"
  | "clipboard"
  | "activity"
  | "plus";

export type FeatureGroupId = "core" | "grow" | "people";

export const featureGroups: {
  id: FeatureGroupId;
  title: string;
  body: string;
}[] = [
  {
    id: "core",
    title: "Run the book",
    body: "A public site, a calendar that tells the truth, day-to-day appointment ops, an activity timeline, payments, reminders, and a funnel that shows where bookings stall.",
  },
  {
    id: "grow",
    title: "Sell more than a single visit",
    body: "Gift cards people actually want to buy, optional add-ons that raise the ticket, seasonal discounts you can aim, and prepaid packages that keep the calendar full.",
  },
  {
    id: "people",
    title: "Staff and clients",
    body: "Invite the team with their own hours, and keep one history per person - bookings, purchases, and messages together.",
  },
];

export type Feature = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  description: string;
  image: string;
  gallery: string[];
  /** Optional muted loop behind the page hero (with image as poster). */
  heroVideo?: string;
  icon: FeatureIcon;
  group: FeatureGroupId;
  featured?: boolean;
  bullets: string[];
  detailHeadline: string;
  sections: { title: string; body: string }[];
  steps: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
  cta: { title: string; body: string };
};

export const features: Feature[] = [
  {
    slug: "scheduling",
    title: "Smart scheduling",
    eyebrow: "Availability",
    summary: "Hours, buffers, and time zones that stop double-bookings.",
    description:
      "Set weekly hours, block busy times, and let clients pick a slot that actually works. Waitlist fills cancellations instead of leaving holes in your day. Policies for cancel and reschedule live next to the calendar, not in a DM thread.",
    image: "/assets/generated/mock-admin-calendar.png",
    gallery: [
      "/assets/generated/mock-admin-calendar.png",
      "/assets/photos/desk-calendar.jpg",
      "/assets/photos/phone-booking.jpg",
    ],
    icon: "calendar",
    group: "core",
    featured: true,
    bullets: [
      "Flexible weekly hours, plus one-off busy blocks",
      "Buffers between visits so you can reset the room",
      "Time zones handled for remote and traveling clients",
      "Waitlist when you are fully booked - and a ping when a matching slot opens",
      "Cancellation and reschedule windows you control",
      "Duplicate-booking checks so people do not stack the same service",
    ],
    detailHeadline: "A calendar that protects your time",
    sections: [
      {
        title: "Hours that match how you actually work",
        body: "Company hours are the default. Each team member can override a week, an evening, or a whole pattern. External calendars (Google, Outlook, CalDAV) and ICS feeds mark time as busy so the public page never offers a slot you already promised to someone else.",
      },
      {
        title: "Same client, same service - not twice by accident",
        body: "Turn on a duplicate check per service. Hacado looks for another visit for that person and that service within a window you set (1 to 30 days before or after the slot they picked). You choose what happens: show a clear warning and ask them to confirm, or block the second booking. Write the message yourself - include the existing date if you want. Useful for fills, packages of sessions, and anyone who taps Book twice on the same gel set.",
      },
      {
        title: "Cancellations should not empty the chair",
        body: "Set how far in advance a client can cancel or move. You still approve if you do not auto-confirm - pending requests sit on the dashboard until you say yes.",
      },
      {
        title: "The next person on the list gets the opening",
        body: "When a visit is cancelled or moved, or you open hours, Hacado offers that window to the oldest matching waitlist request - same specialist, a time they asked for, a duration that still fits. Email, SMS, or both, with a Book this time link (service already filled in) and a way to leave the list. You choose how long they get exclusive first look (up to an hour) before the next person is offered, and a cooldown so the same request is not pinged every few minutes. Waitlist and these notices are on Solo and Studio.",
      },
      {
        title: "Walk-ins and phone bookings still belong here",
        body: "Add an appointment by hand from Appointments. It uses the same customer record, the same reminders, and the same payment trail as an online booking. The book is one list, not a paper diary plus an app.",
      },
    ],
    steps: [
      {
        title: "Set your hours",
        body: "Weekly schedule, plus extra busy blocks from Google, Outlook, CalDAV, or an ICS feed.",
      },
      {
        title: "Share your page",
        body: "Clients see only what is actually free - including buffers and team calendars.",
      },
      {
        title: "Stay full",
        body: "Waitlist offers the hole to the next matching person. Reminders keep the ones who already booked.",
      },
    ],
    faqs: [
      {
        q: "Can I sync Google Calendar?",
        a: "Yes. Two-way sync with Google Calendar, Outlook, and CalDAV. You can also import busy time from an ICS feed if another product only publishes a subscribe link.",
      },
      {
        q: "What about last-minute cancels?",
        a: "Set how far in advance clients can cancel or reschedule. On Solo, waitlist can email or text the oldest matching request when that time opens, with a book link. You set how long they have before the next person is offered.",
      },
      {
        q: "Do I have to auto-confirm every booking?",
        a: "No. Leave requests pending if you want to review them first. Confirm, decline, or reschedule from the appointment - see Appointment management for statuses, no-shows, and client self-service.",
      },
      {
        q: "Can clients book the same service twice in a week?",
        a: "Yes, unless you turn on duplicate-booking checks on that service. Choose a window of 1 to 30 days, then either warn them and ask to confirm, or block the second visit. You write the message they see.",
      },
      {
        q: "Does scheduling work across time zones?",
        a: "Yes. Clients pick a time in their zone; your calendar stays in yours. Useful for coaches, tutors, and anyone with traveling clients.",
      },
      {
        q: "Does the waitlist offer a specific time, or just say something opened?",
        a: "A matching slot: same staff member, a time in the window they asked for, duration that still fits. The message includes when, and a Book this time button that prefills the service. They can leave the waitlist from the same email or by texting a keyword if you turned SMS on.",
      },
      {
        q: "What is on Free vs Solo?",
        a: "Free includes the calendar, one service, and 15 appointments per cycle. Waitlist, unlimited services, and unlimited bookings start on Solo.",
      },
      {
        q: "Can I see waitlist joins vs finished bookings?",
        a: "Yes. Booking tracking on Solo counts both as conversions and splits them by type, plus the step where people abandon the flow.",
      },
    ],
    cta: {
      title: "Open a book that tells the truth",
      body: "Start on Free. Upgrade when you need waitlist, unlimited services, or payments.",
    },
  },
  {
    slug: "appointments",
    title: "Appointment management",
    eyebrow: "The book",
    summary:
      "You run the visit. Clients can reschedule themselves. Pending or auto-confirm - your rule.",
    description:
      "Every booking is a record you can confirm, move, edit, decline, cancel, or mark no-show. New requests can wait for your approval or confirm themselves. Clients sign into the cabinet to reschedule or cancel inside the windows you set - so Saturday changes do not live in Instagram DMs.",
    image: "/assets/generated/mock-admin-calendar.png",
    gallery: [
      "/assets/generated/mock-admin-calendar.png",
      "/assets/photos/phone-booking.jpg",
      "/assets/photos/desk-calendar.jpg",
    ],
    heroVideo: marketingVideos.laptopDashboard,
    icon: "clipboard",
    group: "core",
    featured: true,
    bullets: [
      "Awaiting confirmation, or auto-confirm when you trust the flow",
      "Confirm, decline, cancel, or record a no-show - with optional refund and notify",
      "Reschedule from the dashboard or let the client do it",
      "Change service, add-ons, staff, duration, price, and notes on edit",
      "Walk-ins and phone bookings added by hand on the same list",
      "Client cabinet: upcoming visits, reschedule, cancel, meeting link, receipts",
    ],
    detailHeadline:
      "The visit has a status. Someone can change it without a DM.",
    sections: [
      {
        title: "You stay in charge of the book",
        body: "Open Appointments or the calendar. Pending requests wait if you do not auto-confirm. Confirm when you are ready, decline what you cannot take, cancel when the client called it off, record a no-show when they did not sit down. Reschedule to a new time. Edit to change the service, add-ons, who performs it, duration, price, or notes. History keeps the old service and the old time so you are not reconstructing the story from memory. Refunds can ride along when you close a paid visit.",
      },
      {
        title: "Pending or auto-confirm - pick the default",
        body: "By default new customer bookings wait for you. Turn on auto-confirm if you want the slot locked as soon as they finish checkout. Prepaid packages can override that (always, never, or inherit) so a pack of fills does not sit in a pending queue if you do not want it to. Pending appointments are a tab on the dashboard home - the morning list, not a buried email.",
      },
      {
        title: "Clients can own their own changes",
        body: "My Cabinet (on Solo) is a sign-in with a short email or SMS code. They see upcoming and past visits, reschedule or cancel inside your policy windows, pay a reschedule fee if you require one, join a video link, and pull a receipt. They do not rewrite the service from the cabinet - changing gel to acrylic is a staff edit, or they cancel and book the right thing. You set how far in advance they may move or cancel, and a max number of reschedules, so last-minute chaos is a setting, not an argument.",
      },
    ],
    steps: [
      {
        title: "Choose confirm vs auto-confirm",
        body: "Review every request, or let checkout lock the slot. Packages can differ.",
      },
      {
        title: "Work the appointment",
        body: "Confirm, move, change the service, decline, cancel, or mark no-show.",
      },
      {
        title: "Let clients self-serve",
        body: "Cabinet login, your cancel/reschedule windows, fewer DMs on Saturday.",
      },
    ],
    faqs: [
      {
        q: "Do I have to approve every booking?",
        a: "No. Auto-confirm locks the appointment when the client finishes. Leave it off and requests stay pending until you confirm or decline. Packages can override the default.",
      },
      {
        q: "Can I change the service after they booked?",
        a: "Yes. Staff can edit the appointment: service, add-ons, assigned team member, duration, price, and notes. History records the old option and the new one.",
      },
      {
        q: "What is the difference between decline, cancel, and no-show?",
        a: "Decline is you rejecting a request. Cancel is the visit not happening (often the client called it off). No-show is they did not arrive. Each can notify the client or stay silent, and can refund payments if you choose.",
      },
      {
        q: "Can clients reschedule themselves?",
        a: "Yes, in the client cabinet on Solo and Studio, inside the reschedule windows and max-count you set. Staff can always reschedule from the dashboard, including on Free.",
      },
      {
        q: "Can clients change the service themselves?",
        a: "Not from the cabinet today. They reschedule the time or cancel. Changing the offering is a staff edit, or they book the correct service after canceling.",
      },
      {
        q: "What about walk-ins?",
        a: "Add an appointment by hand. Same statuses, same customer match, same reminders as an online booking.",
      },
      {
        q: "Is the client cabinet on Free?",
        a: "No. My Cabinet starts on Solo. Staff appointment actions (confirm, reschedule, decline, no-show, edit) are on every plan.",
      },
    ],
    cta: {
      title: "Stop managing Saturday in DMs",
      body: "Staff actions on every plan. Client reschedule and cancel in the cabinet on Solo.",
    },
  },
  {
    slug: "activity",
    title: "Activity events",
    eyebrow: "Audit trail",
    summary:
      "A searchable timeline of what happened - kept 30, 90, or 365 days depending on plan.",
    description:
      "Bookings, payments, team changes, gift card sales, and app installs land on one feed in the admin. Search it, filter by who did it, and jump to the record. Everyday events stay for the window on your plan. Payments, permissions, and other important records never expire.",
    image: "/assets/generated/mock-admin-calendar.png",
    gallery: [
      "/assets/generated/mock-admin-calendar.png",
      "/assets/photos/desk-calendar.jpg",
      "/assets/photos/phone-booking.jpg",
    ],
    icon: "activity",
    group: "core",
    bullets: [
      "One organization-wide feed instead of hunting through email",
      "Filter by event type, severity, person, or date",
      "Jump from an event to the appointment, payment, or settings page",
      "30 days of history on Free, 90 on Solo, 365 on Studio",
      "Payments, permissions, and other audit records never expire",
      "Staff and system actions show who did what",
    ],
    detailHeadline: "Know what happened without reconstructing it from memory",
    sections: [
      {
        title: "The book should leave a trail",
        body: "When a deposit lands, a member’s role changes, or someone installs an app, it shows up on Activity - not only as a toast that disappears. Search by event type or title. Filter by who did it (staff, customer, or the system) and how serious it was. Open the linked record instead of reconstructing the story from DMs and bank emails.",
      },
      {
        title: "History length follows the plan",
        body: "Everyday events stay for a window you pay for: 30 days on Free, 90 on Solo, 365 on Studio. Upgrade keeps a longer look-back for the day-to-day noise - no-shows, design edits, routine bookings - so last quarter is still searchable when you need it.",
      },
      {
        title: "The records that matter do not roll off",
        body: "Payments, synced in-store charges, billing and subscription changes, team invites and permission changes, domain changes, app install or connect failures, and gift card purchases stay. Those are the rows you would need in a dispute or an audit. They are not subject to the plan window.",
      },
    ],
    steps: [
      {
        title: "Work as usual",
        body: "Book, take payment, invite staff, install apps. Events write themselves.",
      },
      {
        title: "Open Activity",
        body: "Dashboard timeline, or the full feed with search and filters.",
      },
      {
        title: "Jump to the record",
        body: "Open the appointment, payment, or settings page from the event.",
      },
    ],
    faqs: [
      {
        q: "How long is activity history kept?",
        a: "30 days on Free, 90 on Solo, and 365 on Studio for everyday events. Upgrade lengthens the window going forward for events that expire.",
      },
      {
        q: "What never expires?",
        a: "Payments, synced card charges, billing and subscription changes, team and invitation records, domain changes, app install and connection events, and gift card purchases. Those stay even on Free.",
      },
      {
        q: "Can clients see the activity feed?",
        a: "No. Activity is an admin timeline. Clients see their own visits in the cabinet, not the organization-wide feed.",
      },
      {
        q: "Is this the same as communication logs?",
        a: "No. Communication logs are the emails and SMS you sent. Activity is what happened in the workspace - bookings, money, people, and apps.",
      },
      {
        q: "Do I get Activity on Free?",
        a: "Yes. The feed is on every plan. Free keeps everyday events for 30 days; Solo 90; Studio 365. Permanent audit rows never expire.",
      },
    ],
    cta: {
      title: "Stop reconstructing last month from memory",
      body: "Activity is on every plan. Keep more history as you grow - 30, 90, or 365 days.",
    },
  },
  {
    slug: "website-builder",
    title: "Website builder",
    eyebrow: "Your brand",
    summary:
      "A full booking website - start from a ready template, or build your own.",
    description:
      "Pick a ready-made look for nails, hair, lashes, spas, coaches, and more - or drag and drop your own pages for services, portfolio, FAQ, gift cards, and booking. Use yourbusiness.hacado.me for free, or connect your own domain on Solo. Clients see you, not a marketplace - and your site can be ready for ChatGPT and clearer Google results without a developer.",
    image: "/assets/generated/mock-booking-site.png",
    gallery: [
      "/assets/generated/hero-workspace.png",
      "/assets/generated/mock-booking-site.png",
      "/assets/photos/nails-studio.jpg",
    ],
    icon: "globe",
    group: "core",
    featured: true,
    bullets: [
      "Browse full-site templates before you sign up - click through like a client",
      "Drag-and-drop pages, no code",
      "Ready for ChatGPT and clearer Google results - without hiring a developer",
      "Your colors, fonts, logo, and design",
      "Free yourbusiness.hacado.me address or your own domain on Solo and Studio",
      "Service menus, galleries, FAQ, blog, and gift cards",
    ],
    detailHeadline: "Look like a studio, not a booking widget",
    sections: [
      {
        title: "Start from a template - or from a blank page",
        body: "Not sure where to begin? Open the template gallery and walk through real booking sites for your kind of work. When you create an account you can start from a look you liked, then change photos, copy, and colors until it feels like yours.",
      },
      {
        title: "The site is the product, not a wrapper",
        body: "Most schedulers give you a link. Hacado gives you pages: about, portfolio, pricing, policies, a blog if you want one, and a book button that stays on-brand. That is why people replace Calendly, Squarespace, or Fresha with a Hacado website, and why a new business can launch without buying a separate host.",
      },
      {
        title: "Publish, then keep editing",
        body: "Change copy, photos, and layout without a developer. Connect a custom domain when you are ready - your domain stays yours. The same builder powers gift card landing pages and the client cabinet, so the experience does not jump to another theme.",
      },
      {
        title: "Easy for people - and for ChatGPT to find",
        body: "When someone asks ChatGPT for a nail studio nearby, or Google shows who you are, they need a clear picture of your business. Hacado can automatically share a plain-language summary of your pages, services, and team for AI assistants, and the same kind of structured details search engines already understand. All automatically - no coding or snippets to maintain.",
      },
      {
        title: "Policies live where people actually read them",
        body: "Cancellation, deposits, and aftercare belong on the site next to booking, not buried in a confirmation email. Add FAQ and legal pages the same way you add a gallery.",
      },
    ],
    steps: [
      {
        title: "Browse templates",
        body: "Open the gallery and click through demos for your industry - no account needed.",
      },
      {
        title: "Make it yours",
        body: "Colors, logo, photos, and copy - about a few minutes once you pick a starting look.",
      },
      {
        title: "Publish",
        body: "Share the link on Instagram, Google, and your cards. Add a domain later.",
      },
    ],
    faqs: [
      {
        q: "Do I still need Squarespace or WordPress?",
        a: "Most people who sell time do not. Hacado is the website and the booking system together. Keep an existing site only if you have a reason - you can still point a Book button at Hacado.",
      },
      {
        q: "Can I preview templates before signing up?",
        a: "Yes. Browse the full-site template gallery - open a demo and click through home, booking, services, and more the way clients will. When you are ready, start free and pick a look to customize.",
      },
      {
        q: "How many pages on Free?",
        a: "Up to 10 pages on Free. Unlimited on Solo and Studio.",
      },
      {
        q: "Can I use my own domain?",
        a: "Yes, on Solo and Studio. Free includes a hacado.me subdomain so you can go live the same day.",
      },
      {
        q: "Is it mobile-friendly?",
        a: "Yes. Pages are built for phones first - that is where most clients book.",
      },
      {
        q: "Will ChatGPT or Google understand my site?",
        a: "Yes - turn on Automatic AI Discovery and Automatic Structured Data in Apps. One helps ChatGPT and similar assistants read a clear summary of your business; the other helps Google understand your pages and services. No coding, no snippets to maintain.",
      },
      {
        q: "Can I show a portfolio?",
        a: "Add gallery blocks and extra pages. Nail, tattoo, hair, and coaching sites all use the same builder.",
      },
      {
        q: "What about a blog or announcements?",
        a: "Blog is available on Solo. Use it for seasonal hours, new services, or a longer explanation of a package.",
      },
      {
        q: "Can I see who started booking and did not finish?",
        a: "Yes. Booking tracking (Financials on Solo) shows conversion to an appointment or waitlist, and which step people stop on - availability, payment, the form, and so on. Opening the page without starting a book does not count as abandoned.",
      },
    ],
    cta: {
      title: "Publish a site this afternoon",
      body: "Browse templates first, or start free with a subdomain. Bring your own domain on Solo.",
    },
  },
  {
    slug: "booking-tracking",
    title: "Booking tracking",
    eyebrow: "The funnel",
    summary:
      "See how people who start a booking convert - or where they stop - including waitlist.",
    description:
      "When someone opens your book, Hacado follows the session: services, availability, payment, forms, then a finish. Finish can be an appointment or a waitlist join. If they leave mid-flow, you see the last step - so you know whether the leak is empty Saturdays, checkout, or the intake form.",
    image: "/assets/generated/mock-admin-calendar.png",
    gallery: [
      "/assets/generated/mock-booking-site.png",
      "/assets/photos/phone-booking.jpg",
      "/assets/generated/hero-workspace.png",
    ],
    icon: "chart",
    group: "core",
    bullets: [
      "Conversion vs abandonment rates on the Financials overview",
      "Converted to a booking or a waitlist - not only a confirmed slot",
      "Drop-off by step: availability, payment, form, and the rest of the flow",
      "Completion vs abandonment over time (day, week, or month)",
      "People who only open the page are not counted as abandoned",
      "Built in - no pixel required (optional Google Analytics app if you want GA4)",
    ],
    detailHeadline: "The book should tell you where it leaks",
    sections: [
      {
        title: "Discovery is the site; the funnel is the book",
        body: "Instagram and Google send people to your page. Booking tracking starts when they actually begin scheduling - picking a service, checking times, paying, submitting a form. You see how those visitors convert, not a vanity pageview count. Traffic-source reports (which ad, which post) still belong in Google Analytics or the ad tool that sent them - connect the Google Analytics app on Solo if you want GA4 page views and conversion events from Hacado.",
      },
      {
        title: "Waitlist is a conversion, not a failure",
        body: "When the calendar is full, joining the waitlist is a successful outcome of the same flow. Tracking splits converted sessions by type so you can tell booked visits apart from people who wanted in and queued. That is more useful than treating every non-appointment as a bounce.",
      },
      {
        title: "Stop guessing which step hurts",
        body: "Abandoned sessions are grouped by last step: they never found a time, they hit payment and left, they stalled on the form, and so on. If deposits scare people off, you will see it at payment. If hours look empty, you will see it at availability. Opening the menu and leaving is ignored on purpose - that is browsing, not a dropped booking.",
      },
    ],
    steps: [
      {
        title: "They start the book",
        body: "A session opens when someone actually moves through scheduling - not merely landing on the site.",
      },
      {
        title: "They finish or they leave",
        body: "Finish is an appointment or waitlist. Leave is tagged with the last step they reached.",
      },
      {
        title: "You read Financials",
        body: "Rates, drop-off by step, and conversion mix - without a separate analytics product.",
      },
    ],
    faqs: [
      {
        q: "Is this Google Analytics?",
        a: "No. Booking tracking is built into Hacado Financials and follows the booking flow only. For site-wide GA4 page views and conversion events (bookings, waitlist, gift cards, packages, forms), connect the Google Analytics app from the store on Solo or Studio.",
      },
      {
        q: "Does joining the waitlist count as converted?",
        a: "Yes. Conversion type distinguishes appointments from waitlist (and other finishes the flow supports).",
      },
      {
        q: "If someone opens the booking page and leaves, is that abandoned?",
        a: "No. Sessions that only request the service list are skipped. Abandonment starts once they have gone further - availability, payment, form, and so on.",
      },
      {
        q: "Which steps can I see?",
        a: "The flow records service options, availability checks, duplicate-booking checks, payment, form submit, and conversion. Abandoned reports group people by the last step they reached.",
      },
      {
        q: "Which plan includes this?",
        a: "Solo and Studio. Financials - including booking completion tracking - is not on Free.",
      },
      {
        q: "Can I see each person who dropped off?",
        a: "The overview is aggregate: rates, mix, and drop-off by step over a date range. If they entered contact details before leaving, that can be on the session - the dashboard is built around the funnel charts, not a marketing CRM of every abandon.",
      },
    ],
    cta: {
      title: "See where the book actually leaks",
      body: "Booking tracking lives in Financials on Solo. No extra pixel to install.",
    },
  },
  {
    slug: "payments",
    title: "Payments",
    eyebrow: "Get paid",
    summary:
      "Deposits, full pay, refunds, and payment links - Stripe, Square, or PayPal.",
    description:
      "Take a deposit so no-shows hurt less. Charge in full when the visit should be prepaid. Send a payment link by email or text when the balance is still open. Track in-store card payments next to online ones. Financials stay in one dashboard on Solo - you pick the processor you already trust.",
    image: "/assets/generated/mock-gift-checkout.png",
    gallery: [
      "/assets/generated/mock-gift-checkout.png",
      "/assets/logos/stripe.svg",
      "/assets/photos/desk-calendar.jpg",
    ],
    icon: "card",
    group: "core",
    featured: true,
    bullets: [
      "Stripe, Square, and PayPal - use one or more",
      "Deposits or pay in full: percent or a fixed amount",
      "Send a payment link by email, SMS, or copy - customer pays on your site",
      "Skip deposits for returning clients after N completed visits",
      "Override the rule per customer when someone burns you - or when they never do",
      "Partial refunds when a visit changes",
      "Sync in-store Square payments back to the appointment",
      "Gift cards and packages checkout on the same processors",
      "Default processor if you connect more than one",
    ],
    detailHeadline: "Lock the slot before they sit down",
    sections: [
      {
        title: "Rules per service, not a one-size checkout",
        body: "A consult might need a small deposit. A three-hour color might need more. A lesson might be paid in full. Set the rule on the service so checkout matches the work, then let Stripe, Square, or PayPal take the card.",
      },
      {
        title: "Deposit settings that match how you actually book",
        body: "Turn deposits on or leave them off. When they are on, the workspace default is a percentage of the price - 20% to hold the chair, 100% to collect in full. Each service can inherit that default, always ask (unless this customer is exempt), or never ask (unless you forced a deposit on the person). Services can also use a fixed amount instead of a percent, capped at the visit price. Optional: do not require a deposit once someone has completed N appointments, so first-timers pay and regulars do not - unless you override that person. If a calculated deposit would be tiny, you can set a threshold that charges the full price instead.",
      },
      {
        title: "Send a link when they still owe",
        body: "Not every balance gets paid at booking. From Collect payment, choose Payment link - email it, text it, or copy it. The client opens a page on your site, optionally verifies who they are, can tip if you allow it, and pays with your usual processor. Pending links show in the same payment list; they do not count as revenue until they pay. Resend, show a QR code at the desk, or cancel if the visit fell through.",
      },
      {
        title: "In-store and online in one history",
        body: "If you already tap cards on Square, Hacado can attach those payments to the visit so you are not reconciling two dashboards. Auto-matched records can wait for staff review when the match is not obvious.",
      },
      {
        title: "You stay the merchant",
        body: "Hacado sends the charge; the processor is still Stripe, Square, or PayPal. Payouts, disputes, and tax reports live in their dashboards. There is no Hacado marketplace taking a cut of the visit.",
      },
    ],
    steps: [
      {
        title: "Connect a processor",
        body: "Square, Stripe, or PayPal - pick what you already have.",
      },
      {
        title: "Set deposit rules",
        body: "Workspace default, per service, or per customer. Percent, fixed amount, or skip after enough completed visits.",
      },
      {
        title: "Collect what is still open",
        body: "Charge at booking, or send a payment link later. Appointment payments, gift cards, and packages stay in one place.",
      },
    ],
    faqs: [
      {
        q: "Are payments on Free?",
        a: "Payment apps start on Solo. Free is for getting the site and calendar live first.",
      },
      {
        q: "Can I take deposits only?",
        a: "Yes. Charge a percentage or a fixed amount at booking and the rest in studio. Set 100% if the visit should be prepaid.",
      },
      {
        q: "Can I send a payment link?",
        a: "Yes on Solo and Studio. Install Payment Links from the app store, keep a default processor connected, then choose Payment link when you collect a payment. Send by email or SMS, copy the URL, or show a QR code. The client pays on your site - not a separate Stripe or Square link page.",
      },
      {
        q: "Can regulars skip the deposit?",
        a: "Yes. Optionally skip deposits after a customer has completed a number of visits you choose. New people still pay. You can still force a deposit (including 100%) on one customer who keeps canceling last minute, or never require it for someone you trust - that override lives on the customer record.",
      },
      {
        q: "Do I have to use Stripe?",
        a: "No. Connect Stripe, Square, PayPal, or more than one. Set a default under Apps.",
      },
      {
        q: "What about tips?",
        a: "Where your processor and Hacado checkout support it, tips can be collected with the payment - including on payment links when you enable tip presets. Details depend on the connected app.",
      },
      {
        q: "Can I refund a deposit?",
        a: "Yes. Partial and full refunds follow the processor’s rules. Your cancellation policy on the site should match what you actually refund.",
      },
      {
        q: "Does Hacado take a booking commission?",
        a: "No marketplace fee. You pay Hacado the plan price. Card fees belong to Stripe, Square, or PayPal as usual.",
      },
    ],
    cta: {
      title: "Stop chasing unpaid slots",
      body: "Payments start on Solo. Connect the processor you already use - send a link when the balance is still open.",
    },
  },
  {
    slug: "notifications",
    title: "Email & SMS",
    eyebrow: "Show up",
    summary: "Reminders that cut no-shows without you texting from your phone.",
    description:
      "Branded emails and SMS before the appointment, aftercare after. Resend or SMTP lets mail come from your domain. SMS credits are included on Solo and Studio; Free can buy credits separately. Templates stay in your voice.",
    image: "/assets/generated/mock-sms-phone.png",
    gallery: [
      "/assets/generated/mock-sms-phone.png",
      "/assets/photos/phone-booking.jpg",
      "/assets/photos/makeup-lashes.jpg",
    ],
    icon: "bell",
    group: "core",
    featured: true,
    bullets: [
      "Email confirmations and reminders",
      "SMS reminders with plan credits or Textbelt",
      "Custom templates that match your brand",
      "Waitlist: email or SMS when a matching slot opens, with a book link",
      "Logs when a client says they never got the message",
      "Resend or SMTP so mail can come from your domain",
      "Auto-replies for common inbound questions",
    ],
    detailHeadline: "Your phone can stay in the drawer",
    sections: [
      {
        title: "Write it once, send it on a schedule",
        body: "Confirmation when they book, reminder the day before, follow-up after. Timing is yours - 24 hours, 2 hours, or both. Aftercare for a tattoo or a lash fill is the same system as a coaching recap.",
      },
      {
        title: "Email from you, not a no-reply void",
        body: "Connect Resend (OAuth, verified domain) or SMTP (Google Workspace, Microsoft 365, or a transactional host) so clients see mail from your domain. Hacado email sending still works if you are not ready.",
      },
      {
        title: "Texts without a second app",
        body: "Solo includes 100 SMS credits a month; Studio includes 300. Free can purchase credits. Textbelt is there if you want pay-as-you-go through their key. Follow local consent rules - Hacado sends what you configure.",
      },
      {
        title: "Waitlist should not mean you call down a list",
        body: "When a matching time opens, the oldest waitlist request gets an email, an SMS, or both - Book this time, or leave the list. You pick the templates, a cooldown between offers, and how long they have exclusive first look before the next person is pinged. Same credits and logs as the rest of your messages. Solo and Studio.",
      },
    ],
    steps: [
      {
        title: "Write it once",
        body: "Confirmation, reminder, follow-up - your words, your tone.",
      },
      {
        title: "Schedule sends",
        body: "24 hours before, 2 hours before, aftercare after - or all of them.",
      },
      {
        title: "Let it run",
        body: "Clients get the message even when you are with someone.",
      },
    ],
    faqs: [
      {
        q: "Does Free include SMS?",
        a: "Email is included. SMS credits can be purchased on Free; Solo includes 100/month, Studio 300/month.",
      },
      {
        q: "Can clients reply?",
        a: "You can set auto-replies for common questions and still see the thread in communications. Staff can message from the appointment as well.",
      },
      {
        q: "Can email come from my domain?",
        a: "Yes. Connect Resend (verify the domain there, then set Sender email) or install SMTP with host and credentials. SPF/DKIM on your DNS still matter for inbox placement.",
      },
      {
        q: "What if someone says they never got a reminder?",
        a: "Settings → Communications → Logs shows outbound email and SMS Hacado already sent.",
      },
      {
        q: "Are templates editable?",
        a: "Yes. Keep the placeholders for time, service, and video link; rewrite the rest in your voice.",
      },
      {
        q: "Do coaches and tutors use the same reminders?",
        a: "Yes. The same confirmation and reminder stack works for in-person visits and video sessions.",
      },
      {
        q: "Does waitlist send a message when a slot opens?",
        a: "Yes, if you turn on slot-opened notices. Oldest matching request first - email, SMS, or both - with a book link and a way to leave. You set exclusive first-look minutes and a cooldown. Same SMS credits as reminders.",
      },
    ],
    cta: {
      title: "Reminders that do not live in your notes app",
      body: "Email on every plan. SMS credits on Solo and Studio, or buy extra.",
    },
  },
  {
    slug: "calendars-video",
    title: "Calendars & video",
    eyebrow: "Connected",
    summary:
      "Google, Outlook, CalDAV, Zoom, Meet, and Teams - plus ICS import for busy time.",
    description:
      "Two-way calendar sync keeps personal life off your booking page. Import an ICS feed when another system only publishes a subscribe link. For coaches and consults, Zoom, Google Meet, or Microsoft Teams links are created automatically.",
    image: "/assets/generated/usecase-coach.png",
    gallery: [
      "/assets/logos/google_calendar.svg",
      "/assets/logos/zoom.svg",
      "/assets/generated/usecase-coach.png",
    ],
    icon: "video",
    group: "core",
    bullets: [
      "Google Calendar and Outlook, two-way",
      "CalDAV for Apple iCloud, Nextcloud, Fastmail, and self-hosted mail",
      "ICS import - paste a feed URL to block busy time",
      "Automatic Zoom, Google Meet, and Microsoft Teams",
      "Secondary calendars can count as busy",
      "No extra tab to create the meeting by hand",
    ],
    detailHeadline: "One calendar, in-person or on video",
    sections: [
      {
        title: "Busy time should be honest",
        body: "Connect Google or Outlook and pick the calendar that drives the workspace. Honour other calendars those accounts can already see. Or use CalDAV for Apple iCloud, Nextcloud, Fastmail, and self-hosted mail servers.",
      },
      {
        title: "Have other calendars? Import with ICS link",
        body: "If a school, side job, or another product gives you a subscribe link (often ending in .ics), paste it. Hacado reads those events as busy too.",
      },
      {
        title: "Video without a second workflow",
        body: "Turn on Zoom, Google Meet, or Teams for services that happen online. The confirmation carries the join link. When the booking moves, meeting details update instead of leaving a stale URL in someone’s inbox.",
      },
    ],
    steps: [
      {
        title: "Connect a calendar",
        body: "Google, Outlook, or CalDAV. ICS feeds fill the gaps.",
      },
      {
        title: "Turn on video if you need it",
        body: "Zoom, Meet, or Teams links go out with the confirmation.",
      },
      {
        title: "Show up once",
        body: "No more creating meetings by hand for every consult.",
      },
    ],
    faqs: [
      {
        q: "Is this a Calendly replacement?",
        a: "For coaches and tutors who want a real website, deposits, and SMS - yes. Calendly is still simpler if you only need a meeting link and already have a site.",
      },
      {
        q: "What is CalDAV for?",
        a: "Calendars that are not Google or Outlook: many business hosts, Apple iCloud, Nextcloud, and specialist providers. You enter a server URL and sign-in; Hacado can read and write events.",
      },
      {
        q: "Can I export my Hacado calendar as ICS?",
        a: "The ICS app is an import: it pulls a public or private feed and treats those events as busy. It does not publish your Hacado book as a subscribe link.",
      },
      {
        q: "Will personal events show on my public page?",
        a: "No. They only block availability. Clients see free slots, not the title of your dentist appointment.",
      },
      {
        q: "Do I need Zoom to offer video?",
        a: "No. Google Meet and Microsoft Teams are first-class options too, depending on what you connect.",
      },
      {
        q: "Corporate Outlook blocked the app?",
        a: "Microsoft 365 sometimes needs an admin to allow Hacado. That is an IT policy, not a missing feature - we document the usual pending-consent cases.",
      },
    ],
    cta: {
      title: "Stop double-booking two calendars",
      body: "Connect Google, Outlook, CalDAV, or an ICS feed after signup.",
    },
  },
  {
    slug: "gift-cards",
    title: "Gift cards",
    eyebrow: "Sell prepaid",
    summary: "Design the card, sell it on your website, redeem it in the book.",
    description:
      "Gift Card Studio is a designer, not a PDF voucher. You pick the look, the amounts, and the copy. Clients buy on your site with Stripe, Square, or PayPal. Staff redeem from the same workspace - holiday rush included.",
    image: "/assets/generated/mock-gift-studio.png",
    gallery: [
      "/assets/generated/mock-gift-studio.png",
      "/assets/generated/mock-gift-checkout.png",
      "/assets/photos/nails-closeup.jpg",
    ],
    icon: "gift",
    group: "grow",
    featured: true,
    bullets: [
      "Visual designer for the card people actually receive",
      "Sell on your Hacado website - not a third-party gift shop",
      "Checkout through Stripe, Square, or PayPal",
      "Multiple designs and amounts (birthday, holiday, studio credit)",
      "Purchased-card ledger and redemption in one admin",
      "Corporate or bulk gifting without handwritten envelopes",
    ],
    detailHeadline: "The gift is your brand, sold on your site",
    sections: [
      {
        title: "Design is the product",
        body: "Open Gift Card Studio, build a design with your colors and wording, then publish it. People gift what looks like you - not a generic e-card. Keep a holiday design next to an always-on studio credit without mixing the art.",
      },
      {
        title: "Selling happens on the website",
        body: "Add a gift cards page to the same site that takes bookings. Visitors pay online with the processor you already connected. No separate Shopify, no printed stock you have to mail. Balances live in Hacado so redemption at the chair is a lookup, not a spreadsheet.",
      },
      {
        title: "Operations that survive Saturday",
        body: "Track sold cards, remaining value, and redemptions. Uninstall is blocked while purchases still need a ledger - that is on purpose. Talk to your accountant about tax and expiry copy for where you operate; the product keeps the numbers, you keep the policy.",
      },
    ],
    steps: [
      {
        title: "Connect payments",
        body: "Stripe, Square, or PayPal first - gift cards check out through the same apps.",
      },
      {
        title: "Design the card",
        body: "Create a design, set amounts, put it on a page of your site.",
      },
      {
        title: "Sell and redeem",
        body: "Clients buy online. You apply the balance when they book or walk in.",
      },
    ],
    faqs: [
      {
        q: "Which plan includes gift cards?",
        a: "Solo and Studio. Free is for getting bookings live.",
      },
      {
        q: "Do I design the card in Hacado?",
        a: "Yes. Gift Card Studio is a visual designer in your admin - layouts, copy, and amounts - not a downloadable template you edit elsewhere.",
      },
      {
        q: "Where do people buy them?",
        a: "On your Hacado website. Add a gift cards page (or block) so the purchase stays on your domain or subdomain.",
      },
      {
        q: "Which payment methods work?",
        a: "Whatever you connected: Stripe, Square, or PayPal. Connect at least one before you sell.",
      },
      {
        q: "Can I sell more than one design?",
        a: "Yes. Holiday, birthday, and standard credit can each have their own look and amounts.",
      },
      {
        q: "What if someone buys for a friend?",
        a: "Checkout can send the card to another email. The recipient redeems it against appointments the same way.",
      },
      {
        q: "Can I still sell a card in person?",
        a: "Yes. Issue and record the sale in admin when someone pays at the desk, then the balance is in the same ledger.",
      },
    ],
    cta: {
      title: "Put a gift card on your site",
      body: "Designer plus checkout on Solo. Holiday inventory without the paper.",
    },
  },
  {
    slug: "discounts",
    title: "Discounts",
    eyebrow: "Promos",
    summary:
      "Seasonal codes, date windows, and rules for where a deal actually applies.",
    description:
      "Run a slow-season sale, a holiday code, or a first-visit offer without rewriting prices by hand. You control when the discount is valid, which appointment dates it covers, which services or packages it can touch, and how many times it can be used.",
    image: "/assets/generated/hero-workspace.png",
    gallery: [
      "/assets/generated/hero-workspace.png",
      "/assets/generated/mock-booking-site.png",
      "/assets/photos/desk-calendar.jpg",
    ],
    icon: "percent",
    group: "grow",
    bullets: [
      "Percent or amount off",
      "Start and end dates for the promo itself",
      "Separate window for which appointment dates qualify",
      "Limit to specific services, add-ons, or packages",
      "Promo codes (several per discount; clients can apply up to two)",
      "Caps: total uses and uses per customer",
    ],
    detailHeadline: "A sale you can aim, not a permanent markdown",
    sections: [
      {
        title: "Seasonal does not mean forever",
        body: "Give the discount a start and end date so January quiet weeks and December gift traffic do not share the same code. Disable it without deleting it when the season ends. Existing appointments that already used the deal stay as they were.",
      },
      {
        title: "When it applies is not only “today”",
        body: "You can restrict the visit date separately from the checkout date. Example: buy in November, but the discount only counts for appointments in January. That is how you fill a slow month without cheapening this week’s book.",
      },
      {
        title: "Where it applies is a list, not a hope",
        body: "Limit the deal to named services, add-on bundles, or prepaid packages. A color-correction promo should not knock 20% off a $15 add-on unless you say so. Caps stop one customer (or the whole internet) from draining the offer.",
      },
    ],
    steps: [
      {
        title: "Name the offer",
        body: "Percent or amount, optional codes, on or off.",
      },
      {
        title: "Set the clocks",
        body: "Promo window, plus which appointment dates are eligible.",
      },
      {
        title: "Aim it",
        body: "Limit to services, add-ons, or packages. Cap uses if you need to.",
      },
    ],
    faqs: [
      {
        q: "Can I run a holiday or slow-season sale?",
        a: "Yes. Set start and end dates on the discount. Turn it off when the season ends without deleting history.",
      },
      {
        q: "Can the deal apply only to visits in a certain month?",
        a: "Yes. Earliest and latest eligible appointment dates are separate from when the code itself is active.",
      },
      {
        q: "Can I exclude some services?",
        a: "Limit the discount to the options, add-on bundles, and packages you list. Everything else stays full price.",
      },
      {
        q: "Do clients type a code?",
        a: "They can. Each discount can have multiple codes. Checkout allows up to two promo codes on a booking.",
      },
      {
        q: "Can I cap how many times a code is used?",
        a: "Yes - a global maximum and a per-customer maximum. After that, the code stops applying.",
      },
      { q: "Which plan includes discounts?", a: "Solo and Studio." },
      {
        q: "Will deleting a discount change old bookings?",
        a: "No. Removing a discount does not rewrite appointments that already used it.",
      },
    ],
    cta: {
      title: "Run a promo that knows its own rules",
      body: "Seasonal windows, service limits, and codes on Solo.",
    },
  },
  {
    slug: "packages",
    title: "Packages",
    eyebrow: "Bundles",
    summary: "Sell prepaid session bundles and track remaining visits.",
    description:
      "A package is a bundle people buy once and book against later - ten massages, five fills, a coaching block. Set the service, how many sessions, how long credits last, and who on the team can honour them. Sell on the website or issue a package at the desk.",
    image: "/assets/generated/mock-gift-checkout.png",
    gallery: [
      "/assets/generated/mock-gift-checkout.png",
      "/assets/generated/usecase-salon.png",
      "/assets/photos/coach-laptop.jpg",
    ],
    icon: "package",
    group: "grow",
    bullets: [
      "Prepaid session counts (for example 5× or 10×)",
      "Tied to a service so booking spends a credit",
      "Optional expiry after purchase",
      "Sell on the website or record an in-store sale",
      "Restrict which staff can perform package visits",
      "See remaining, used, expired, and cancelled packages per client",
    ],
    detailHeadline: "Cash up front, visits over time",
    sections: [
      {
        title: "Bundles are not a discount code",
        body: "A discount is a one-time markdown. A package is inventory: the client owns N visits of a service. You set price, session count, and validity (or no expiry). Max purchases per customer stops someone from banking a year of stock if that is not the deal.",
      },
      {
        title: "Sell it where they already book",
        body: "Publish the package on your site next to single visits, or issue it in admin when someone pays in person. Booking with a package spends a credit and can auto-confirm differently from a regular booking if you want prepaid clients to skip the pending queue.",
      },
      {
        title: "Teams can still control who delivers",
        body: "By default anyone assigned to the service can take a package visit. Add eligible staff if only certain people should honour a premium bundle. Remaining credits show on the customer record so the front desk is not guessing.",
      },
    ],
    steps: [
      {
        title: "Define the bundle",
        body: "Service, session count, price, optional expiry.",
      },
      {
        title: "Put it on sale",
        body: "Public on the website, or sell at the desk into a customer record.",
      },
      {
        title: "Book against it",
        body: "Each visit spends a credit until the package is exhausted or expired.",
      },
    ],
    faqs: [
      {
        q: "What is a package vs a gift card?",
        a: "A gift card is stored value they can spend on whatever you allow. A package is a prepaid count of a specific service - five lash fills, ten lessons, a coaching block.",
      },
      {
        q: "Can packages expire?",
        a: "Yes. Set validity in months after purchase, or leave it open-ended.",
      },
      {
        q: "Can I sell packages on my website?",
        a: "Yes. Mark the package public so it appears in booking. You can also issue one in admin after an in-store payment.",
      },
      {
        q: "Can only certain staff honour a package?",
        a: "Yes. Leave eligible staff empty for anyone on the service, or name the members who can perform those visits.",
      },
      {
        q: "What if the package has already been sold?",
        a: "You cannot delete a package that has purchases. Deactivate it so new sales stop; existing credits still work until used or expired.",
      },
      { q: "Which plan includes packages?", a: "Solo and Studio." },
    ],
    cta: {
      title: "Sell a bundle, not only a single slot",
      body: "Prepaid packages on Solo - website or in-store.",
    },
  },
  {
    slug: "add-ons",
    title: "Add-ons",
    eyebrow: "Upsells",
    summary:
      "Optional extras at booking - gel removal, a beard trim, a check-in between sessions.",
    description:
      "An add-on is a priced extra attached to a service: paraffin, nail art, deep conditioning, a take-home plan. Clients multi-select what they want after picking the visit. Duration and price stack onto the appointment. Staff overrides keep one stylist’s beard trim from looking like another’s.",
    image: "/assets/generated/mock-booking-site.png",
    gallery: [
      "/assets/generated/mock-booking-site.png",
      "/assets/photos/nails-closeup.jpg",
      "/assets/photos/hair-salon.jpg",
    ],
    icon: "plus",
    group: "grow",
    bullets: [
      "Reusable catalog - attach the same add-on to several services",
      "Own price and duration (minutes) that stack onto the visit",
      "Clients pick none, one, or many in the booking flow",
      "Staff overrides: different price, duration, or unavailable for a member",
      "Optional custom fields once an add-on is selected",
      "Promo rules can require an add-on bundle (all items in the set)",
    ],
    detailHeadline: "Raise the ticket without inventing a new service",
    sections: [
      {
        title: "Extras belong on the service, not in a sidebar menu",
        body: "Build add-ons once under Services, then attach them to the appointments that should offer them. Gel removal rides on a fill; aromatherapy rides on a massage. Reorder the list so the upsells you care about show first. Package purchases skip the enhance step - credits are for the bundle, not à la carte extras.",
      },
      {
        title: "Booking shows the math",
        body: "After the client picks a service (and a specialist when you use staff), an enhance step lists only the add-ons that person can actually offer. Each row shows +price and +time. They can skip entirely. Changing the set clears a promo they already typed, so the discount re-checks against what is really in the cart.",
      },
      {
        title: "Team and promos stay precise",
        body: "By default anyone on the parent service can deliver the add-on. Override a member’s price or duration, or mark them unable to offer it so it never appears for their book. Discounts can require a named add-on bundle - every item in the set - so a “mani + paraffin” code does not fire on a bare polish.",
      },
    ],
    steps: [
      {
        title: "Create the extras",
        body: "Name, optional price and duration, attach to the services that should sell them.",
      },
      {
        title: "Tune the team",
        body: "Leave defaults, or set per-member price, duration, or unavailable.",
      },
      {
        title: "Let clients choose",
        body: "They multi-select at booking. You can still edit add-ons on the appointment afterward.",
      },
    ],
    faqs: [
      {
        q: "Are add-ons required?",
        a: "No. Clients can skip the enhance step. Custom fields on an add-on are only required after they select that add-on.",
      },
      {
        q: "Do add-ons change appointment length?",
        a: "Yes, when you set a duration. Minutes stack onto the service so the calendar stays honest.",
      },
      {
        q: "Can the same add-on sit on several services?",
        a: "Yes. Create it once in the add-ons catalog and attach it wherever it belongs.",
      },
      {
        q: "What if only one stylist offers nail art?",
        a: "Use a staff override: mark other members unable to offer that add-on, or give them a different price and duration.",
      },
      {
        q: "Can a discount require certain add-ons?",
        a: "Yes. Limit the promo to an add-on bundle - the booking must include every add-on in that set. You can also limit by service or package.",
      },
      {
        q: "Do package bookings show add-ons?",
        a: "No. Buying or redeeming a prepaid package skips the enhance step so credits stay tied to the bundle.",
      },
      {
        q: "Which plan includes add-ons?",
        a: "Every plan. Free still has the one-service limit; attach add-ons to the services you have.",
      },
    ],
    cta: {
      title: "Put extras on the book, not in a DM",
      body: "Catalog, attach, and let clients multi-select at checkout.",
    },
  },
  {
    slug: "team",
    title: "Staff management",
    eyebrow: "Studio",
    summary:
      "Seats, roles, and a calendar per person - clients pick a favorite or next available.",
    description:
      "Studio is for more than one person on the book. Invite members, spend the five included seats, add more from $4/month, and give each person hours that match their chair. The public site stays one brand; the calendar is not a shared Google spreadsheet.",
    image: "/assets/generated/usecase-salon.png",
    gallery: [
      "/assets/generated/usecase-salon.png",
      "/assets/photos/hair-salon.jpg",
      "/assets/photos/nails-studio.jpg",
    ],
    icon: "users",
    group: "people",
    featured: true,
    bullets: [
      "5 team members included on Studio",
      "Extra seats from $4/month, billed with the subscription",
      "Invite by email with a role",
      "Individual calendars and schedule overrides",
      "Clients book a person or the next opening",
      "Restrict services and packages to eligible staff",
    ],
    detailHeadline: "Several chairs, one site",
    sections: [
      {
        title: "Seats are how the team fits",
        body: "Studio includes five members. When you need a sixth, purchase additional seats from Team settings - they recur with the plan and unlock more invites. Solo is one operator; if two people each need a login and a calendar, that is Studio.",
      },
      {
        title: "Hours belong to the person",
        body: "Company hours are the default. Each member can differ - evenings, guest-spot days, vacation. Clients see availability for the specialist they chose, or a combined “next available” path when you offer it. Double-booking a chair is a settings problem, not a group chat problem.",
      },
      {
        title: "Not everyone does every service",
        body: "Assign who can perform a service or a prepaid package. A colorist and a barber sharing a site should not appear as interchangeable unless they are. Roles keep admin work (billing, apps) off people who only need their own book.",
      },
    ],
    steps: [
      {
        title: "Upgrade to Studio",
        body: "Five seats included. Buy more if the roster grows.",
      },
      {
        title: "Invite the team",
        body: "Email, role, their hours and services.",
      },
      {
        title: "Let clients choose",
        body: "A person they know, or the next free chair.",
      },
    ],
    faqs: [
      {
        q: "We are two people - Solo or Studio?",
        a: "Solo is one business owner. Studio is for multiple employees (or partners) who need their own calendars and logins. Extra seats start at $4/month.",
      },
      {
        q: "How many people are included?",
        a: "Studio includes 5 team members. Purchase additional seats when you run out.",
      },
      {
        q: "Can clients pick a favorite staff member?",
        a: "Yes. They can also take the next available slot when you offer that path on the booking page.",
      },
      {
        q: "Does each person get their own hours?",
        a: "Yes. Weekly schedule plus member exceptions. Busy time from their connected calendar still blocks their public slots.",
      },
      {
        q: "Can I limit who performs a service?",
        a: "Yes - on the service and on packages (eligible staff). Everyone else stays off that offering.",
      },
      {
        q: "What happens if I am out of seats?",
        a: "Invites pause until you purchase seats or someone leaves. The purchase dialog is in Team settings.",
      },
      {
        q: "Is team on Free?",
        a: "Free and Solo are single-user. Team seats are a Studio capability.",
      },
    ],
    cta: {
      title: "Put the whole floor on one book",
      body: "Studio is $59/month with 5 seats. Extra seats from $4/month.",
    },
  },
  {
    slug: "clients",
    title: "Client management",
    eyebrow: "Customers",
    summary:
      "Auto-match people by email or phone. Track visits and purchases - and sync the list to your phone with CardDAV.",
    description:
      "When someone books, Hacado looks up email and phone and attaches the visit to an existing customer instead of creating a twin. You get appointment history, files, communications, gift cards, and packages on that profile - plus payments that can auto-match to the visit. CardDAV pushes the same contacts onto a phone or desktop address book so inbound calls show a name, not a mystery number.",
    image: "/assets/generated/mock-admin-calendar.png",
    gallery: [
      "/assets/generated/mock-admin-calendar.png",
      "/assets/photos/phone-booking.jpg",
      "/assets/photos/coach-laptop.jpg",
    ],
    icon: "user",
    group: "people",
    featured: true,
    bullets: [
      "Match returning clients by email or phone automatically",
      "One profile: details, appointments, files, messages",
      "Purchase history - gift cards and prepaid packages",
      "Search the book by name, email, or phone",
      "Schedule again from the last visit",
      "Deposit rules per person: always, never, or inherit the default",
      "In-store and online payments can attach to the appointment",
      "CardDAV sync so your customers show up in the phone address book",
    ],
    detailHeadline: "A client is a person, not a pile of form submits",
    sections: [
      {
        title: "Auto-match so the list stays clean",
        body: "New bookings call get-or-create: if the email or phone already exists, the visit lands on that customer and contact details update if they changed. The same lookup runs when a form is submitted with an email or phone, so intake is not a second anonymous row. You are not merging duplicates every Sunday.",
      },
      {
        title: "History you can actually use at the desk",
        body: "Open Customers, search, and see every appointment, attached files, and the message thread. Schedule the next visit from the last one. Notes live on the person, not in a stylist’s personal phone. The client cabinet lets them reschedule and update their own profile when you turn that on.",
      },
      {
        title: "Purchases and payments follow the same person",
        body: "Sold packages and gift cards show on the customer. Card-present or delayed processor payouts can auto-match to an appointment; staff confirm anything that needs a second look. That is how a Square tap at the desk and an online deposit end up on the same visit.",
      },
      {
        title: "Deposit required - or not - for this person",
        body: "Workspace and service rules are the default. On the customer you can inherit them, never require a deposit, or always require one and set the percent (including 100% prepaid). Use always for repeat last-minute cancelers and reschedulers who keep burning Saturday. Use never for the client who never no-shows and should not hit checkout every fill. Inherit for everyone else. A global “skip deposit after N completed visits” still applies unless you force the opposite on this record.",
      },
      {
        title: "The same people, on your phone",
        body: "Install CardDAV and Hacado gives you ability to sync your customers to a compatible contacts app - iPhone, Android, or desktop. Incoming calls can show the client’s name instead of a raw number.",
      },
    ],
    steps: [
      {
        title: "They book once",
        body: "Email and phone create or match a customer automatically.",
      },
      {
        title: "You look them up",
        body: "Appointments, files, messages, packages, and gift cards on one page.",
      },
      {
        title: "You book them again",
        body: "Schedule from history, or let them self-serve in the cabinet. CardDAV puts the same names on your phone.",
      },
    ],
    faqs: [
      {
        q: "How does auto-match work?",
        a: "On booking, Hacado searches by email first, then phone. If either hits an existing customer, the appointment is attached there and details are updated. A new record is created only when neither matches.",
      },
      {
        q: "What if they used a new email but the same phone?",
        a: "A phone match still returns the existing customer, so the visit does not fork into a duplicate.",
      },
      {
        q: "Can I add someone who called in?",
        a: "Yes. Create a customer or add an appointment by hand - same records as online booking.",
      },
      {
        q: "Can I require a deposit only for some customers?",
        a: "Yes. On the customer record: inherit the usual rules, never require a deposit, or always require one (set the percent, including 100%). That is how you prepaid-lock a last-minute canceler and skip checkout for someone you trust. Workspace settings can also skip deposits after N completed visits for everyone who inherits the default.",
      },
      {
        q: "Where do I see what they bought?",
        a: "The customer page lists appointments plus prepaid packages and gift card activity. Payment tabs on the appointment show deposits and synced in-store charges.",
      },
      {
        q: "Do form submissions create extra customers?",
        a: "If the form includes email or phone, Hacado tries the same lookup before creating a person. Answers still live under Form responses.",
      },
      {
        q: "Is there a separate Contacts app?",
        a: "Inside Hacado, Customers is the list - search it rather than keeping a parallel spreadsheet. CardDAV is the app that syncs those contact cards out to a phone or desktop address book.",
      },
      {
        q: "Can I sync customers to my phone?",
        a: "Yes. Install CardDAV, copy the URL and credentials into your phone’s contacts app (or another CardDAV client). Names and numbers from Hacado show up for caller ID. CalDAV is the calendar equivalent - do not mix the two. Solo and Studio.",
      },
      {
        q: "Can clients see their own history?",
        a: "Yes, with the client cabinet (My Cabinet) on Solo - upcoming visits, reschedule and cancel in your policy windows, receipts, and meeting links. Staff still confirm, edit the service, decline, or mark no-show from Appointments.",
      },
    ],
    cta: {
      title: "Keep one history per person",
      body: "Auto-match is built in. Cabinet and unlimited clients on Solo.",
    },
  },
];

export function featureBySlug(slug: string) {
  return features.find((f) => f.slug === slug);
}

export const featuredFeatures = features.filter((f) => f.featured);
