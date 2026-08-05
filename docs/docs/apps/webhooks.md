---
sidebar_position: 41
description: Send booking and payment signals to your own secure web URL for automation.
---

# Webhooks

Webhooks asks Hacado to call a **website address that you host** whenever certain events occur. Examples include new appointments, status changes, or payment updates (**the full checklist appears inside the Webhooks form**). Each request is usually an HTTPS POST with JSON data. You may add a **secret** so your server can confirm the message truly came from Hacado.

You need someone comfortable with servers or integrations. They deploy the URL, reply with a fast success signal (usually within a fraction of a second), then finish heavy work afterward.

## Adding the App

1. Build or subscribe to HTTPS hosting that trusts modern certificates and keeps logs.
2. Open **Apps**, open **Store**, install **Webhooks**.
3. Enter **Webhook URL**, pick only the events you need, optionally add **secret**, save.
4. Trigger a rehearsal booking or payment that matches one of your selected events. Watch server logs for the payload and confirm signature checks if you use them.

If nothing arrives or signatures fail, open **[Apps troubleshooting](/docs/apps/troubleshooting)** with your technical partner.

### Good to know

Collect only the smallest amount of personal data your automation truly needs and follow guidance from privacy counsel where required.

## Usage

### Push each booking into an internal database or spreadsheet

**Use this when:** You already maintain reporting outside Hacado.

### Hand off to automation tools your company approves

**Use this when:** Zapier, Make, or similar is allowed by policy and security review.

### Send your own email or chat ping from your server

**Use this when:** You want Slack or SMS fan-out under your control.

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Delete the Webhooks entry or uninstall the App.
3. Rotate any shared secret and remove firewall allow rules that only existed for Hacado.

### What changes afterward

Hacado stops calling your automation. Processes that depended on continual pushes may pause until you replace them or poll data another way.

