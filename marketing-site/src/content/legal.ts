import {
  DOCS_URL,
  GITHUB_ISSUES_URL,
  LEGAL_EMAIL,
  PRIVACY_EMAIL,
  SUPPORT_EMAIL,
} from "./site";

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const privacyUpdated = "August 24, 2026";
export const termsUpdated = "August 24, 2026";

/** Based on hacado.com/privacy (4 Dec 2025), expanded for production SaaS. */
export const privacySections: LegalSection[] = [
  {
    title: "Introduction",
    paragraphs: [
      "At Hacado we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our appointment scheduling platform, websites, and related services (together, the “Service”), including hacado.com, app.hacado.com, customer sites on hacado.me, and custom domains that point to Hacado.",
      "Please read this policy carefully. By using the Service you acknowledge this policy. If you do not agree, do not use the Service.",
    ],
  },
  {
    title: "Who this policy covers",
    paragraphs: [
      "Hacado is a multi-tenant SaaS product. We process two kinds of personal data:",
    ],
    bullets: [
      "Account and billing data about you (the business owner, staff, or marketing-site visitor) - we are the controller of this data.",
      "Client data you store in your workspace (your customers’ names, contact details, appointments, forms, messages) - you are the controller; we process that data on your instructions as a processor.",
    ],
  },
  {
    title: "Information we collect",
    paragraphs: [
      "We collect information you provide directly to us and information generated when you use the Service, including:",
    ],
    bullets: [
      "Account information (name, email address, phone number where provided, password or SSO identifiers, authentication codes).",
      "Business information (business name, address, public booking URL, branding, timezone, language).",
      "Calendar and scheduling data (availability, appointments, busy times synced from connected calendars).",
      "Payment and billing metadata (plan, subscription status, invoices). Card numbers are handled by Polar and/or your connected payment providers (Stripe, Square, PayPal); we do not store full card PANs.",
      "Communications you send through the Service (email and SMS templates, logs of messages sent to your clients, support emails).",
      "Client records you enter or that your clients submit (profiles, intake forms, booking notes), on your behalf.",
      "Usage data, device and log information, and analytics (including cookies and similar technologies).",
    ],
  },
  {
    title: "How we use your information",
    paragraphs: ["We use the information we collect to:"],
    bullets: [
      "Provide, maintain, secure, and improve the Service.",
      "Process subscriptions and send billing-related notices.",
      "Send appointment confirmations, reminders, and other notifications you configure.",
      "Respond to comments, questions, and support requests.",
      "Monitor and analyze trends, usage, and activities to keep the Service reliable.",
      "Detect, investigate, and prevent fraud, abuse, and security incidents.",
      "Comply with law and enforce our Terms of Service.",
    ],
  },
  {
    title: "Legal bases (EEA/UK)",
    paragraphs: [
      "Where GDPR or UK GDPR applies, we process personal data because it is necessary to perform a contract with you, because we have a legitimate interest in operating a secure SaaS product, because you have given consent (for example optional analytics cookies), or because we must comply with a legal obligation.",
    ],
  },
  {
    title: "Information sharing",
    paragraphs: [
      "We do not sell your personal information. We may share information with service providers who help us operate the Service, so long as they are bound to protect it. Typical categories include:",
    ],
    bullets: [
      "Billing: Polar (subscriptions, customer portal, tax invoices).",
      "Payments you enable: Stripe, Square, PayPal (and similar processors you connect).",
      "Communications: email delivery (including SMTP you configure) and SMS providers (such as TextBelt) when you send texts.",
      "Integrations you connect: Google, Microsoft, Zoom, and other calendar or video providers.",
      "Infrastructure, monitoring, and analytics providers (including Google Analytics on our marketing site where cookies are allowed).",
      "Professional advisers and authorities when required by law.",
    ],
  },
  {
    title: "Cookies and tracking",
    paragraphs: [
      "We use cookies and similar technologies to keep you signed in, remember preferences (including cookie consent), and - if you accept optional cookies - understand how the marketing site is used.",
      "You can refuse optional cookies via our cookie bar or your browser settings. Necessary cookies (or equivalent local storage) are required for the Service to function, including security and remembering your consent choice. If you block all cookies, some features may not work.",
    ],
  },
  {
    title: "Data security",
    paragraphs: [
      "We implement technical and organizational measures designed to protect personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption in transit, access controls, and regular operational review. No method of transmission or storage is 100% secure.",
    ],
  },
  {
    title: "Retention",
    paragraphs: [
      "We keep account and billing records for as long as you have an account and as required for tax, accounting, and legal obligations after cancellation. Workspace content is retained while your organization is active and deleted or anonymized after account closure within a commercially reasonable period, except where we must retain it (for example dispute or security logs).",
    ],
  },
  {
    title: "International transfers",
    paragraphs: [
      "We and our processors may process data in the United States and other countries. Where required, we use appropriate safeguards for transfers of personal data from the EEA, UK, or Switzerland.",
    ],
  },
  {
    title: "Your rights",
    paragraphs: [
      "Depending on your location (including the EEA, UK, and certain US states such as California), you may have rights to:",
    ],
    bullets: [
      "Access and receive a copy of your personal data.",
      "Rectify or update inaccurate personal data.",
      "Request deletion of your personal data.",
      "Object to or restrict processing.",
      "Data portability.",
      "Withdraw consent where processing is based on consent.",
      "Opt out of “sale” or “sharing” of personal information where those terms apply - we do not sell personal information.",
    ],
  },
  {
    title: "Your clients’ rights",
    paragraphs: [
      "If you are a business using Hacado, you are responsible for providing your own privacy notice to your clients and for honoring their requests regarding data you control. We will assist you with processor obligations (access, deletion, export) through the product and support channels where feasible.",
    ],
  },
  {
    title: "Children",
    paragraphs: [
      "The Service is not directed to children under 16. We do not knowingly collect personal information from children. If you believe we have, contact us and we will delete it.",
    ],
  },
  {
    title: "Changes to this policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. We will post the new policy on this page and update the “Last updated” date. Material changes may also be announced by email or in the product. Continued use after the effective date constitutes acceptance of the updated policy.",
    ],
  },
  {
    title: "Contact us",
    paragraphs: [
      `If you have questions about this Privacy Policy or want to exercise a privacy right, contact us at ${PRIVACY_EMAIL}. For product support, use ${SUPPORT_EMAIL} or our support page.`,
    ],
  },
];

/** Based on hacado.com/terms (4 Dec 2025), with timeli.sh replaced and SaaS billing expanded. */
export const termsSections: LegalSection[] = [
  {
    title: "Agreement to terms",
    paragraphs: [
      "By accessing or using Hacado, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you must not use the platform. The materials on this platform are protected by applicable copyright and trademark law.",
      "These Terms apply to the Hacado websites, the admin application, public booking sites we host, and related services. Additional terms may apply to specific apps or payment providers you connect.",
    ],
  },
  {
    title: "The service",
    paragraphs: [
      "Hacado provides an appointment scheduling platform that enables businesses to manage bookings, communicate with clients, process payments through connected processors, and publish booking websites. We may modify, suspend, or discontinue any part of the Service with reasonable notice when practicable. Features may differ by plan (Free, Solo, Studio).",
    ],
  },
  {
    title: "Eligibility and accounts",
    paragraphs: [
      "You must be able to form a binding contract. You are responsible for maintaining the confidentiality of your account credentials and for restricting access to your devices. You accept responsibility for all activity under your account and must notify us immediately of unauthorized use or any other security breach.",
    ],
  },
  {
    title: "Acceptable use",
    paragraphs: [
      "Permission to use Hacado for your personal or commercial business is subject to these conditions. You must not:",
    ],
    bullets: [
      "Use the Service for any illegal or unauthorized purpose, including spam or deceptive booking practices.",
      "Transmit malware, harmful code, or content that infringes others’ rights.",
      "Attempt to gain unauthorized access to any part of the Service or other customers’ data.",
      "Interfere with or disrupt the proper working of the platform.",
      "Copy, modify, reverse engineer, or resell the Service’s software except as allowed by law.",
      "Use the Service to send SMS or email in violation of anti-spam or telecommunications rules.",
    ],
  },
  {
    title: "Your content and your clients",
    paragraphs: [
      "You retain ownership of content you submit, post, or display through the Service (including your website pages, branding, and client records). You grant us a worldwide, non-exclusive, royalty-free license to host, reproduce, and process that content solely to provide and improve the Service.",
      "You are responsible for the accuracy of your services, prices, availability, and the cancellation, reschedule, deposit, and refund policies you show to your clients. Those policies are between you and your clients; Hacado is not a party to those appointments.",
    ],
  },
  {
    title: "Plans, payment, and cancellation of Hacado",
    paragraphs: [
      "Paid features are billed in advance on a recurring basis through Polar. Current list prices include Solo at $29 per month and Studio at $59 per month, plus optional add-ons (for example extra seats and SMS credits). Taxes may apply. We may change prices with at least 30 days’ notice.",
      "You may cancel your Hacado subscription at any time from the Polar customer portal. Access to paid features continues until the end of the then-current billing period unless otherwise stated at checkout. Subscription refunds, if any, follow Polar’s and our refund practice for unused prepaid time; they are separate from refunds you owe your own clients.",
      "The Free plan is limited (including appointment, service, and page caps). We may suspend booking or payment actions if a paid subscription is past due.",
    ],
  },
  {
    title: "Third-party services",
    paragraphs: [
      "Calendar, video, SMS, email, and payment integrations are provided by third parties under their own terms. You authorize us to exchange data with providers you connect. We are not responsible for those providers’ availability, fees, or data practices beyond our own processing described in the Privacy Policy.",
    ],
  },
  {
    title: "SMS and email",
    paragraphs: [
      "If you send SMS or email through Hacado, you represent that you have obtained any required consent from recipients and will honor opt-outs. Unused SMS credits typically do not constitute a cash refund except as required by law or stated at purchase.",
    ],
  },
  {
    title: "Intellectual property",
    paragraphs: [
      "Hacado, the Hacado logo, and the Service software are owned by us or our licensors. These Terms do not grant you any right to use our trademarks except as needed to identify the Service.",
    ],
  },
  {
    title: "Disclaimer",
    paragraphs: [
      "The Service is provided “as is” and “as available.” To the fullest extent permitted by law, we disclaim warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that bookings, notifications, or payments will be uninterrupted or error-free.",
    ],
  },
  {
    title: "Limitation of liability",
    paragraphs: [
      "To the fullest extent permitted by law, Hacado and its suppliers will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for lost profits, lost data, or business interruption, arising out of the use or inability to use the Service, even if we have been advised of the possibility of such damage.",
      "Our aggregate liability arising out of these Terms or the Service will not exceed the amounts you paid to us for the Service in the twelve months before the claim (or, if you use only the Free plan, one hundred US dollars).",
    ],
  },
  {
    title: "Indemnification",
    paragraphs: [
      "You agree to indemnify, defend, and hold harmless Hacado and its officers, directors, employees, agents, and suppliers from claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of your use of the Service, your content, your dealings with your clients (including deposits, cancellations, and refunds), or your violation of these Terms.",
    ],
  },
  {
    title: "Termination",
    paragraphs: [
      "We may suspend or terminate your account immediately, without prior notice where we reasonably believe you have breached these Terms, created a security risk, or failed to pay. Upon termination your right to use the Service ceases. Provisions that by their nature should survive (including ownership, disclaimers, limitation of liability, and indemnification) will survive.",
    ],
  },
  {
    title: "Governing law",
    paragraphs: [
      "These Terms are governed by applicable law, without regard to conflict-of-law rules. Our failure to enforce any provision is not a waiver. If a provision is unenforceable, the remainder stays in effect.",
    ],
  },
  {
    title: "Changes to terms",
    paragraphs: [
      "We may modify these Terms. If a change is material, we will provide at least 30 days’ notice before new terms take effect, by posting on this page and updating the date below, and where appropriate by email. What is material is determined in our reasonable discretion. Continued use after the effective date constitutes acceptance.",
    ],
  },
  {
    title: "Contact us",
    paragraphs: [
      `Questions about these Terms of Service: ${LEGAL_EMAIL}. Product help: ${SUPPORT_EMAIL} or ${GITHUB_ISSUES_URL.replace("/new", "")}. Documentation: ${DOCS_URL}.`,
    ],
  },
];
