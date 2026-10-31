import type { MetaRecord } from "nextra";

function separator(title: string) {
  return {
    type: "separator" as const,
    title,
  };
}

const meta: MetaRecord = {
  overview: "Overview",
  troubleshooting: "Troubleshooting",
  "--calendars": separator("Calendars & scheduling"),
  "google-calendar": "Google Calendar",
  outlook: "Outlook",
  "ics-feed": "ICS Feed",
  caldav: "CalDAV Calendar",
  "busy-events": "Busy events",
  "url-busy-events": "URL busy events",
  "weekly-schedule": "Weekly schedule",
  "smart-schedule": "Smart schedule",
  "calendar-writer": "Calendar Writer",
  "url-schedule-provider": "URL schedule provider",
  "--meetings": separator("Meetings"),
  zoom: "Zoom",
  "--payments": separator("Payments"),
  stripe: "Stripe",
  square: "Square",
  paypal: "PayPal",
  "payment-links": "Payment Links",
  "--email": separator("Email"),
  smtp: "SMTP",
  resend: "Resend",
  "email-notification": "Email notification",
  "customer-email-notification": "Customer email notification",
  "appointment-notifications": "Appointment notifications",
  "customer-waitlist-notifications": "Customer waitlist notifications",
  "--sms": separator("Text messaging"),
  "platform-sms": "Platform SMS",
  "text-belt": "Textbelt SMS",
  "text-message-notification": "Text message notification",
  "customer-text-message-notification": "Customer text message notification",
  "text-message-auto-reply": "Text message auto reply",
  "text-message-resender": "Text message resender",
  "--site": separator("Website features"),
  blog: "Blog",
  waitlist: "Waitlist",
  forms: "Forms",
  "gift-card-studio": "Gift Card Studio",
  "my-cabinet": "My Cabinet",
  "google-analytics": "Google Analytics",
  "--other": separator("Contacts & automation"),
  carddav: "CardDAV contacts",
  webhooks: "Webhooks",
};

export default meta;
