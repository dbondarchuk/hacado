---
sidebar_position: 45
description: Connect Google Analytics 4 to track website visits and public conversions.
---

# Google Analytics

Connect Google Analytics 4 so your public website loads the GA4 tag, and Hacado records bookings, waitlist joins, gift card purchases, package sales, and form submissions as conversions.

## Adding the App

1. Open **Apps**, then **Store**.
2. Find **Google Analytics** and install or connect it.
3. Sign in with the Google account that owns the GA4 property. Finish any two-step prompts Google asks for.
4. On the consent screen approve every permission Hacado lists. Incomplete approval commonly leaves the App on **Pending**.
5. Pick the **web data stream** whose measurement ID (starts with `G-`) matches this website. Setup stays open until you choose a stream — the App stays **Pending** until then.

If setup loops or hangs, read **[Apps troubleshooting](/docs/apps/troubleshooting)**.

### Good to know

Use a Google account that can edit the GA4 property. Hacado creates a Measurement Protocol API secret on the selected stream so server-side conversions can be sent securely.

## Usage

### Track page views on your public website

**Use this when:** You want GA4 page views without pasting a snippet under Appearance → Scripts.

**You need:** A connected App with a selected web data stream. The gtag script is injected site-wide automatically.

### Record public conversions

**Use this when:** You want bookings, waitlist joins, gift card purchases, package purchases, and form submissions to appear in GA4.

**You need:** The App connected and a stream selected. Only customer- or visitor-originated actions are sent (admin-created records are skipped).

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Open **Google Analytics** and disconnect or uninstall depending on wording shown.
3. Confirm so Hacado stops injecting the tag and sending conversions.

### What changes afterward

Your public site no longer loads the GA4 tag from this App. Events already in Google Analytics stay until you delete them in Google.

### Outside Google

You can revoke Hacado under Google **Account security**. Measurement Protocol secrets created for Hacado remain on the data stream until you remove them in the GA4 Admin UI.
