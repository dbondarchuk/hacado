---
sidebar_position: 27
description: Timed reminders and follow-ups around appointments by email or SMS.
---

# Appointment notifications

This App sends **scheduled** messages around each appointment. Examples: remind the client two days before, send a thank-you one day after, or prompt a review a few days later. You choose the timing, pick **email**, **SMS**, or both **when Hacado shows both on your screens**, and attach templates for each rule.

## Adding the App

1. Finish email basics first (**[SMTP](/docs/apps/smtp)** if you mail from your own domain).
2. If you send SMS reminders, add **[Textbelt SMS](/docs/apps/text-belt)** and confirm you have texting credits.
3. Open **Apps**, then **Store**, and install **Appointment notifications**.
4. Create a rule with a clear internal name (for example, “Reminder 24 hours prior”). Pick the timing, channel, templates, then save.
5. Book a practice appointment from your booking page and verify the message arrives **and** respects quiet hours.

For delivery problems, see **[Apps troubleshooting](/docs/apps/troubleshooting)**.

### Good to know

**[Customer email notification](/docs/apps/customer-email-notification)** and **[Customer text message notification](/docs/apps/customer-text-message-notification)** often fire right when status changes (**confirmed**, **rescheduled**, similar). Appointment notifications fires on a **calendar clock** instead. Decide which Apps you need so guests are not overloaded.

## Usage

### Day-before reminders to cut missed visits

**Use this when:** People forget midday meetings or evening services.

**You need:** A valid email or mobile number saved on the booking, SMS credits when you text.

### Friendly follow-ups after the visit

**Use this when:** You want gratitude messages, short surveys, or a polite review link later.

**You need:** Copy that meets local marketing and review-platform rules **no bribery wording**.

### Different messages for flagship services versus quick add-ons

**Use this when:** Premium clients expect a richer tone.

**You need:** Rules filtered by service category if your workspace supports filters on rules.

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Open **Appointment notifications**, delete unused rules first if prompted, then remove the App entirely.

### What changes afterward

Scheduled reminders stop. Instant customer emails or texts from other Apps **may still send** unless you turn those off separately.
