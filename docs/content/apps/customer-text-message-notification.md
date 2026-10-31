---
description: Text customers when their booking status changes.
---

# Customer text message notification

Sends **SMS to clients** when their appointment moves between major states (pending, confirmed, declined, canceled, no-show, rescheduled). Each state has an on/off switch. For United States and Canada numbers, Hacado sends fixed built-in copy that includes the business name, service, time, and a manage link when a public modify-appointment page exists. Other countries still use a saved SMS template when one is stored.

## Adding the App

1. Install **[Textbelt SMS](/docs/apps/text-belt)** and verify you have quota.
2. Open **Apps**, then **Store**, and add **Customer text message notification**.
3. Turn on the states you actually use. Leave the others off to stay silent.
4. Book a private test path. United States and Canada texts include `Txt STOP to unsubscribe`. The first text to that customer also includes the message-and-data rates sentence. See [Platform SMS](/docs/apps/platform-sms).

If sending fails **[Apps troubleshooting](/docs/apps/troubleshooting)** helps with carrier blocks or mis-typed numbers.

### Good to know

Some countries require registration for business texting. Research local carrier rules before broadcasting.

## Usage

### Quick SMS confirmations for mobile-first clients

**Use this when:** Guests read texts faster than inbox mail.

**You need:** Booking records with correct mobile numbers recorded at booking time.

### Gentle decline or reschedule texts

**Use this when:** Tone should feel personal even on bad news.

**You need:** Short honest copy plus instructions on what to do next.

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Remove **Customer text message notification**.

### What changes afterward

Clients stop automatic status SMS from this layer. Tell them how you will reach them if they expect texts.
