---
sidebar_position: 22
description: Take payments through Square at checkout or with Square hardware aligned to your studio.
---

# Square

Connect Square when your business collects money through Square for online checkout, saved cards, terminals, gift cards mapped in Square, or similar flows exposed in Hacado.

## Adding the App

1. Open **Apps**, then **Store**, and install **Square**.
2. Sign in with your Square Seller account and approve access.
3. Map locations or catalog items when the wizard asks so Hacado and Square agree on basics.
4. Run a tiny test transaction in Sandbox or Live as your onboarding suggests.
5. Set **Default apps** if multiple payment processors exist.

Square may flag compliance or risky categories. Resolve alerts in Square first. **[Apps troubleshooting](/docs/apps/troubleshooting)** covers generic connection loops.

### Good to know

Regional availability differs. Confirm Square sells and settles in your country before you rely on it for every client.

## Usage

### Card present checkout after visit

**Use this when:** You tap or insert cards on a Square reader at the desk.

**You need:** Hardware paired, firmware current, staff trained on reader errors.

### Online prepay for classes or limited seats

**Use this when:** You want payment before the slot is confirmed.

**You need:** Inventory or capacity settings that match how you sell out.

### Gift cards through Square

**Use this when:** Redemption should hit Square ledgers.

**You need:** Gift items configured in Square and linked the way Hacado expects.

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Disconnect Square and point **Default apps** at another processor if you still take payments.

### What changes afterward

Hacado stops creating new Square payments. Open Square tabs (disputes, payouts) still live in Square until closed.

### Outside Hacado

Remove or rotate Hacado in Square Developer or connected apps screens if compliance asks for a clean revoke.
