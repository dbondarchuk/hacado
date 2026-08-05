---
sidebar_position: 19
description: Pull open hours or schedule data from your own web address for calendar integration.
---

# URL schedule provider

This App is for teams with a **developer or vendor** who exposes schedule data over HTTP. Hacado calls your URL with a time range (start and end as standard ISO query parameters) and expects a response that describes available schedule information for calendar integration. It is different from **[URL busy events](/docs/apps/url-busy-events)**, which only supplies busy blocks.

## Adding the App

1. Confirm the contract with your technical partner: URL, headers, and JSON (or similar) shape Hacado accepts.
2. Open **Apps**, then **Store**, and install **URL schedule provider**.
3. Enter the **URL** and optional **headers** (for example a bearer token).
4. Save until the App reports connected. Parse or auth errors must be fixed on your server or in the values you typed.

See **[Apps troubleshooting](/docs/apps/troubleshooting)** if the App never connects.

### Good to know

If you only need to block time from a regular calendar file, **[ICS Feed](/docs/apps/ics-feed)** is usually simpler and does not need custom code.

## Usage

### Single source of truth lives in another system

**Use this when:** HR, franchise HQ, or another tool already defines when services may run.

**You need:** Reliable hosting and monitoring. If your endpoint is down, booking may break or fall back depending on product behaviour.

### Authenticated schedule API

**Use this when:** Random internet traffic must not read your schedule.

**You need:** Headers that stay secret; rotate them if they leak.

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Open **URL schedule provider** and clear the URL / headers or uninstall.

### What changes afterward

Hacado stops asking your server for schedule data. Your weekly hours and other calendar Apps take over again.

### Outside Hacado

Revoke keys or tokens you issued for Hacado. Update your server so old tokens cannot be reused.
