---
description: Timed reminders before visits and follow-ups after, by email or SMS.
---

# Appointment Reminders

This App sends **scheduled** messages around each appointment. Examples: remind the client two days before, send a thank-you one day after, or prompt a review a few days later. You choose the timing and the channel. Email rules use an email template. SMS rules use an on/off switch (and a custom template when allowed). This does **not** send the message that goes out the moment a booking is created or changed - that is **[Customer Appointment Updates](/docs/apps/customer-appointment-updates)**.

## Adding the App

1. Finish email basics first (**[SMTP](/docs/apps/smtp)** if you mail from your own domain).
2. If you send SMS reminders, add **[Textbelt SMS](/docs/apps/text-belt)** and confirm you have texting credits.
3. Open **Apps**, then **Store**, and install **Appointment Reminders**.
4. Create a rule with a clear internal name (for example, "Reminder 24 hours prior"). Pick the timing and channel. Email rules need a template. SMS rules need the switch on. Then save.
5. Book a practice appointment and verify the message arrives **and** respects quiet hours.

For delivery problems, see **[Apps troubleshooting](/docs/apps/troubleshooting)**.

### Good to know

**[Customer Appointment Updates](/docs/apps/customer-appointment-updates)** fires right when status changes. This App fires on a **calendar clock**. Decide which Apps you need so guests are not overloaded.

## Usage

### Day-before reminders to cut missed visits

**Use this when:** People forget midday meetings or evening services.

**You need:** A valid email or mobile number saved on the booking, SMS credits when you text.

### Friendly follow-ups after the visit

**Use this when:** You want gratitude messages, short surveys, or a polite review link later.

**You need:** Copy that meets local marketing and review-platform rules.

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Open **Appointment Reminders**, delete unused rules first if prompted, then remove the App entirely.

### What changes afterward

Scheduled reminders stop. Instant customer emails or texts from **[Customer Appointment Updates](/docs/apps/customer-appointment-updates)** may still send unless you turn those off separately.
