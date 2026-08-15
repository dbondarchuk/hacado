---
sidebar_position: 15
description: Pull busy times from your own web address so Hacado can block those slots.
---

# URL busy events

This App is for teams that run a small **API** on their side. Hacado calls your URL and asks, in effect, “When is busy?” Your server answers with busy intervals so Hacado can hide those times from booking. Start and end times are sent as query parameters in a standard ISO date format.

## Adding the App

1. Agree with your developer or vendor on the exact URL and response format Hacado expects.
2. Open **Apps**, then **Store**, and install **URL busy events**.
3. Enter the **URL**. Add optional **headers** (for example an API key) if your server needs them.
4. Save and confirm the App connects. Fix format or auth errors with your technical contact.

If Hacado cannot read the response, see **[Apps troubleshooting](/docs/apps/troubleshooting)** and check server logs on your side.

### Good to know

This is not a normal “paste an ICS link” setup. If you only have a calendar link, use **[ICS Feed](/docs/apps/ics-feed)** instead.

## Usage

### Keep Hacado in sync with another scheduling system

**Use this when:** Another product already knows when people are busy and can expose that over HTTP.

**You need:** A stable HTTPS endpoint, correct response shape, and someone who can fix outages quickly.

### Send a secret token with each request

**Use this when:** Your endpoint must reject anonymous callers.

**You need:** Headers filled in safely; treat values like passwords.

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Open **URL busy events** and delete the URL / headers or disconnect the App.

### What changes afterward

Hacado stops calling your server for busy times. Availability falls back to your other rules (weekly schedule, calendar Apps, manual busy blocks).

### Outside Hacado

Rotate or revoke any API keys you gave Hacado. Your server stays under your control.
