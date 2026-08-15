---
sidebar_position: 21
description: Accept card and wallet payments through Stripe inside Hacado checkout.
---

# Stripe

Stripe lets you charge clients when Hacado collects payment at checkout, deposit, tipping, or similar flows your workspace supports.

## Adding the App

1. Open **Apps**, then **Store**, and install **Stripe**.
2. Sign in or create Stripe as guided. Stripe may ask for business details, banking, identity checks, or industry questions.
3. Finish until Hacado shows Stripe as connected with no onboarding warnings in Stripe’s dashboard.
4. Under **Apps** » **Default apps**, pick Stripe if checkout should prefer it when more than one payment App exists.

Incomplete Stripe onboarding blocks live charges even if Hacado looks connected. See **[Apps troubleshooting](/docs/apps/troubleshooting)** and Stripe’s own requirement banners.

### Good to know

Fraud controls, payouts, refunds, disputes, tax, and payouts are reviewed in Stripe’s dashboard first. Hacado sends charges; Stripe remains the processor of record.

## Usage

### Take payment when someone books online

**Use this when:** You want upfront payment before the visit.

**You need:** Prices set in Hacado, Stripe live mode on, cards or wallets enabled in Stripe settings.

### Refund from a booking

**Use this when:** Policies allow money back after cancel or complaint.

**You need:** Permissions in Hacado for finance-friendly roles and cleared funds timing from Stripe rules.

### Reconcile payouts with bookkeeping

**Use this when:** Accounting needs payouts to match bookings.

**You need:** Export habits from Stripe; Hacado holds booking detail, Stripe holds payout and fees.

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Disconnect Stripe or uninstall the App before you flip customers to another processor.

### What changes afterward

New payments through Hacado do not ride Stripe unless you connect it again or choose another processor. Past charges stay in Stripe for statements and audits.

### Outside Hacado

In Stripe Dashboard you can deactivate API keys, revoke access, or disconnect the Hacado integration if your procedure requires.
