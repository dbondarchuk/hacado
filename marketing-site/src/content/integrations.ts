export type IntegrationItem = {
  name: string;
  src: string;
  what: string;
  why: string;
  how: string;
  /** Path on docs.hacado.com, e.g. /docs/apps/google-calendar */
  docsPath?: string;
};

export type IntegrationGroup = {
  title: string;
  intro: string;
  items: IntegrationItem[];
  maxColumns?: number;
};

export const integrationGroups: IntegrationGroup[] = [
  {
    title: "Calendars",
    intro:
      "Two-way sync for Google, Outlook, and CalDAV. ICS is an import: paste a feed so those events count as busy.",
    items: [
      {
        name: "Google Calendar",
        src: "/assets/logos/google_calendar.svg",
        what: "Connect a Google account so Hacado appointments appear on that calendar and existing Google events block public booking times. Optional Google Meet for online services.",
        why: "You already plan the day in Google. Secondary calendars (personal, school, another job) can count as busy so clients never see a slot you cannot take.",
        how: "Apps → Store → Google Calendar. Sign in, approve every permission (partial consent often leaves the app pending), then pick the calendar for appointments. Use Default apps if more than one calendar integration is connected.",
        docsPath: "/docs/apps/google-calendar",
      },
      {
        name: "Outlook",
        src: "/assets/logos/outlook.svg",
        what: "Two-way sync with Microsoft Outlook or Microsoft 365 so bookings land on Exchange and Outlook busy time stays honest in Hacado. Teams meeting links when your workspace supports them.",
        why: "Staff live in Outlook on desktop, web, or mobile. Corporate mailboxes are often the system of record - not Google.",
        how: "Apps → Store → Outlook. Sign in with the Microsoft account the business uses. Company Entra / Conditional Access may need an admin to allow Hacado first. Pick the calendar, then set it as default if needed.",
        docsPath: "/docs/apps/outlook",
      },
      {
        name: "CalDAV",
        src: "/assets/logos/caldav.svg",
        what: "A calendar standard used by many business hosts, Nextcloud-style servers, Fastmail, and self-hosted mail. Hacado connects with a server URL plus username and password (or app password), then reads and writes events like the other calendar apps.",
        why: "Policy or preference keeps calendars off Google and Microsoft. CalDAV is the native way those servers speak - not a workaround.",
        how: "Collect the CalDAV URL and credentials from your provider. Apps → Store → CalDAV Calendar. Enter the fields, test, then choose the calendar on that server. Self-signed TLS often fails until the host uses a public certificate.",
        docsPath: "/docs/apps/caldav",
      },
      {
        name: "ICS feed (import)",
        src: "/assets/logos/ics.svg",
        what: "Import only. You paste an https:// subscribe link (often ending in .ics). Hacado fetches those events and treats them as busy. It does not write back and it does not publish your Hacado book as a public ICS export.",
        why: "School timetables, a partner’s calendar, or another product that only offers a feed. You still want those hours off the booking page.",
        how: "Copy the full ICS URL from the other system. Apps → Store → ICS Feed. Paste, save, wait for a success message. If the feed never loads, the URL is usually private, blocked, or refreshed too slowly by the host.",
        docsPath: "/docs/apps/ics-feed",
      },
    ],
  },
  {
    title: "Video",
    intro:
      "Join links created with the booking - not copied from another tab after the fact.",
    items: [
      {
        name: "Zoom",
        src: "/assets/logos/zoom.svg",
        what: "Hacado attaches Zoom meeting details to online appointments when Zoom is connected and the service is set up for it.",
        why: "Clients expect a join link in the confirmation and reminder. Reschedules should refresh that link instead of leaving a dead meeting.",
        how: "Apps → Store → Zoom. Sign in and finish every permission screen. Confirm the app shows connected. Paid Zoom plans and admin approval can differ from a basic account - check Zoom if meeting creation is blocked.",
        docsPath: "/docs/apps/zoom",
      },
      {
        name: "Google Meet",
        src: "/assets/logos/google_meet.svg",
        what: "Meet links for virtual appointments, typically alongside a connected Google Calendar / Google Workspace account.",
        why: "Your clients already have Google accounts, or you do not want a second video vendor besides the calendar you sync.",
        how: "Connect Google Calendar with the scopes Hacado lists, then enable Meet on the services that happen online. Incomplete Google consent is the usual reason Meet never appears.",
        docsPath: "/docs/apps/google-calendar",
      },
      {
        name: "Microsoft Teams",
        src: "/assets/logos/microsoft_teams.svg",
        what: "Teams online-meeting details on bookings when Outlook / Microsoft 365 is connected and the service is online.",
        why: "Corporate clients join from Teams more readily than Zoom. One Microsoft sign-in can cover calendar and video.",
        how: "Connect Outlook, allow the permissions for online meetings, and mark the service as video. Tenant admins may need to allow the Hacado app in Entra.",
        docsPath: "/docs/apps/outlook",
      },
    ],
    maxColumns: 3,
  },
  {
    title: "Payments",
    intro:
      "You stay the merchant. Hacado sends the charge through the processor you already use.",
    items: [
      {
        name: "Stripe",
        src: "/assets/logos/stripe.svg",
        what: "Card and wallet payments at Hacado checkout - deposits, pay in full, gift cards, and packages, depending on what you turned on.",
        why: "Stripe is the default for many online businesses. Payouts, Radar, and tax tools stay in Stripe; Hacado is not a marketplace taking a cut of the visit.",
        how: "Apps → Store → Stripe. Finish Stripe onboarding (identity, bank, industry). Incomplete Stripe onboarding blocks live charges even if Hacado looks connected. Set Stripe as default if you also connected Square or PayPal.",
        docsPath: "/docs/apps/stripe",
      },
      {
        name: "PayPal",
        src: "/assets/logos/paypal.svg",
        what: "PayPal balance, linked bank, or eligible cards at checkout where Hacado supports PayPal.",
        why: "Some clients will not use a card form. Overseas buyers often trust PayPal’s buyer-protection story more than a name they do not know.",
        how: "Apps → Store → PayPal. Use a business-ready PayPal account and finish verification. PayPal pauses payouts for their own checks - resolve those in PayPal, then pick it under Default apps if it should lead.",
        docsPath: "/docs/apps/paypal",
      },
      {
        name: "Square",
        src: "/assets/logos/square.svg",
        what: "Online Square checkout plus alignment with Square hardware and in-store payments that can sync back to the appointment.",
        why: "You already tap cards at the desk. Hacado should not force Stripe if Square is the ledger. Gift cards and locations map in Square when you use those features.",
        how: "Apps → Store → Square. Sign in with the seller account, map locations if asked, run a small test. Confirm Square operates in your country. Auto-matched in-store payments can wait for staff review when the match is unclear.",
        docsPath: "/docs/apps/square",
      },
    ],
    maxColumns: 3,
  },
  {
    title: "Email, SMS & automation",
    intro:
      "Send from your domain with Resend or SMTP, text through credits or Textbelt, and push events to your own URL.",
    items: [
      {
        name: "Resend",
        src: "/assets/logos/resend.svg",
        what: "Transactional email through your Resend account via OAuth. Confirmations and reminders can appear from a domain you verified in Resend - without pasting an API key in Hacado.",
        why: "You want branded From addresses without running your own mail server. Resend handles delivery; Hacado keeps the templates and booking triggers.",
        how: "Verify the sending domain in Resend (DNS / DKIM). Apps → Store → Resend. Connect with OAuth, then set Sender email (on that domain) and optional Sender name. Under Default apps, choose Resend as the email sender if needed.",
        docsPath: "/docs/apps/resend",
      },
      {
        name: "SMTP",
        src: "/assets/logos/smtp.svg",
        what: "Outbound mail through your own server so confirmations and reminders can appear from your domain (Workspace, Microsoft 365, or a transactional host).",
        why: "Shared sending works, but inboxes trust mail that matches your website. Staff notices can use the same path. Prefer SMTP when you already run mail on that host.",
        how: "Collect host, port, encryption, username, and password or app password. Apps → Store → SMTP. Send a test and check spam. SPF, DKIM, and DMARC still belong on your DNS.",
        docsPath: "/docs/apps/smtp",
      },
      {
        name: "Textbelt SMS",
        src: "/assets/logos/textbelt.svg",
        what: "An external SMS provider. Hacado stores your Textbelt API key and remaining credit so notification apps can send through Textbelt.",
        why: "Pay-as-you-go when plan SMS credits are not the model you want, or you already buy Textbelt for other tools.",
        how: "Buy credit at Textbelt, copy the API key, install Textbelt SMS in the Hacado store, paste the key. Then enable the customer/staff texting apps that actually send. Follow local consent rules.",
        docsPath: "/docs/apps/text-belt",
      },
      {
        name: "Webhooks",
        src: "/assets/logos/webhooks.svg",
        what: "Hacado POSTs JSON to an HTTPS URL you host when bookings, payments, discounts, or other events you select occur. Optional secret for signature checks.",
        why: "Accounting, a CRM, or a custom dashboard that is not in Hacado. This is for someone comfortable running a server - not a no-code zap by itself.",
        how: "Stand up an HTTPS endpoint. Apps → Store → Webhooks. Enter the URL, pick events, optional secret, save. Trigger a test booking and read your logs. Reply quickly with success; do heavy work afterward.",
        docsPath: "/docs/apps/webhooks",
      },
    ],
    maxColumns: 4,
  },
  {
    title: "Marketing & analytics",
    intro:
      "Send page views and public conversions into Google Analytics 4 - without pasting a gtag snippet by hand.",
    items: [
      {
        name: "Google Analytics",
        src: "/assets/logos/google_analytics.svg",
        what: "Connect a GA4 property so your public Hacado site loads the tag automatically, and bookings, waitlist joins, gift card purchases, package sales, and form submissions are recorded as conversions (visitor-originated actions only).",
        why: "You already run ads or look at GA for Instagram and Google traffic. Hacado Financials covers the booking funnel; GA covers attribution and site-wide reports in the tool you already use.",
        how: "Apps → Store → Google Analytics (Solo and Studio). Sign in with a Google account that can edit the property, approve every permission, then pick the web data stream whose measurement ID starts with G-. The app stays Pending until a stream is selected.",
        docsPath: "/docs/apps/google-analytics",
      },
    ],
    maxColumns: 1,
  },
  {
    title: "Contacts",
    intro:
      "CardDAV is for people, not calendars. Sync the Hacado customer list into a phone or desktop address book.",
    items: [
      {
        name: "CardDAV",
        src: "/assets/logos/carddav.svg",
        what: "Hacado publishes your customers as contact cards. After you install the app you get a CardDAV URL, username, and password to paste into a compatible phone or desktop contacts app. This is not CalDAV - CalDAV syncs calendars.",
        why: "Inbound calls can show a client’s name. Reception and personal phones stay aligned with the book without exporting a spreadsheet. Rotate the password if a device leaves the team.",
        how: "Apps → Store → CardDAV contacts. Copy the URL and credentials only onto devices you trust. Add an account in iOS, Android, or another CardDAV client. Regenerate the password when someone leaves or you suspect it leaked.",
        docsPath: "/docs/apps/carddav",
      },
    ],
    maxColumns: 1,
  },
];

export const integrations = [
  { name: "Google Calendar", src: "/assets/logos/google_calendar.svg" },
  { name: "Outlook", src: "/assets/logos/outlook.svg" },
  { name: "CalDAV", src: "/assets/logos/caldav.svg" },
  { name: "ICS import", src: "/assets/logos/ics.svg" },
  { name: "CardDAV", src: "/assets/logos/carddav.svg" },
  { name: "Zoom", src: "/assets/logos/zoom.svg" },
  { name: "Google Meet", src: "/assets/logos/google_meet.svg" },
  { name: "Microsoft Teams", src: "/assets/logos/microsoft_teams.svg" },
  { name: "Stripe", src: "/assets/logos/stripe.svg" },
  { name: "PayPal", src: "/assets/logos/paypal.svg" },
  { name: "Square", src: "/assets/logos/square.svg" },
  { name: "Resend", src: "/assets/logos/resend.svg" },
  { name: "Google Analytics", src: "/assets/logos/google_analytics.svg" },
];
