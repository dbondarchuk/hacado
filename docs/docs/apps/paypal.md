---
sidebar_position: 23
description: Offer PayPal and related wallet buttons where Hacado supports PayPal checkout.
---

# PayPal

PayPal lets clients pay with PayPal balances, linked bank, or eligible cards alongside your other processors when your checkout supports PayPal through this integration.

## Adding the App

1. Open **Apps**, then **Store**, and install **PayPal**.
2. Sign in with a **business-ready** PayPal account. Finish email, phone, and identity steps PayPal asks for.
3. Connect until Hacado shows PayPal successfully linked.
4. If you offer more than one way to pay, open **Default apps** and verify which processor should lead.

PayPal frequently pauses payouts for verification. Resolve messages in PayPal itself. **[Apps troubleshooting](/docs/apps/troubleshooting)** helps with redirects and Pending states.

### Good to know

PayPal refunds and settlements follow PayPal timelines, which differ from instant card capture.

## Usage

### Let overseas clients choose a wallet they trust

**Use this when:** Your audience prefers PayPal for buyer protection familiarity.

**You need:** PayPal commerce features enabled on your PayPal dashboard for the flows you expose.

### Run specials with PayPal funding offers

**Use this when:** Marketing runs PayPal-specific campaigns.

**You need:** Promo rules honoured in PayPal and legal copy on your site.

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Disconnect PayPal and choose another processor if checkout must stay open.

### What changes afterward

PayPal disappears as a checkout option unless you reconnect. Orders already paid settle under PayPal’s normal lifecycle.

### Outside Hacado

Revoke REST credentials or unlink Hacado in PayPal merchant settings if auditors require a formal disconnect.
