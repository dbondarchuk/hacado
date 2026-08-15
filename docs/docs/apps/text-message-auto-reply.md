---
sidebar_position: 32
description: Send one automatic SMS reply when someone texts your business number.
---

# Text message auto reply

When inbound texts reach Hacado through your texting setup, this App can send **one automatic reply** using a template you write. Common uses: confirm hours, thank the sender, share a booking link, or say staff will answer later.

## Adding the App

1. Complete whatever inbound SMS setup your tenancy requires (often tied to Textbelt or similar). Follow on-screen banners until Hacado shows the path is ready.
2. Open **Apps**, then **Store**, and install **Text message auto reply**.
3. Choose the **auto reply template**. Write clear simple language. Mention that a human will follow up when that is true.
4. Send a test inbound text and confirm you get only one polite loop (no endless reply chains).

Template required errors mean you left the body empty. See **[Apps troubleshooting](/docs/apps/troubleshooting)** if webhooks fail silently.

### Good to know

If local law requires stating that a bot replied, add that text yourself in the template.

## Usage

### After-hours reassurance

**Use this when:** You close at night but clients still text promotions or short codes.

**You need:** Correct hours in the message plus a link to self-serve booking.

### Share a secure booking link calmly

**Use this when:** Voice mail points people to text instead of call.

**You need:** HTTPS links that work on mobile.

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Remove **Text message auto reply**.

### What changes afterward

Inbound texts are no longer answered automatically. Update voicemail and website copy if you promised instant replies.
