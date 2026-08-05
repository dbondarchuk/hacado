---
sidebar_position: 18
description: Write Hacado appointments into a connected calendar you select.
---

# Calendar Writer

Calendar Writer keeps an external calendar up to date when appointments change in Hacado. After you connect it, Hacado **adds, updates, or removes** calendar events on the calendar App you pick (for example **Google Calendar**, **Outlook**, or **CalDAV Calendar**) whenever appointments are created, rescheduled, or canceled.

## Adding the App

1. Connect the calendar you want to receive events first (for example **Google Calendar** or **Outlook**) from **Store**, if it is not already installed.
2. Open **Apps**, then **Store**, and install **Calendar Writer**.
3. In setup, open the **Calendar storage** (or similar) dropdown and pick the connected calendar App that should receive appointment events.
4. Save or **Add** / **Update** to finish.

If the list is empty, you need a calendar connection that allows writing. Errors about the target calendar often mean that App was removed; pick a new one. See **[Apps troubleshooting](/docs/apps/troubleshooting)**.

### Good to know

This App does **not** replace your main calendar connection. You still usually connect Google or Outlook as the source of busy time. Calendar Writer is the bridge that pushes **appointment-shaped events** into the calendar you select.

## Usage

### One shared Google or Outlook calendar for the whole desk

**Use this when:** Everyone should see bookings on one team calendar view.

**You need:** A calendar App connected and chosen in Calendar Writer, with permission to create events.

### Staff each see their own external calendar filled

**Use this when:** Each provider has their own mailbox calendar.

**You need:** Separate calendar connections per person if your workspace model works that way, and Writer pointed at each.

### Keep CalDAV hosted copy updated

**Use this when:** Your policy stores events on a CalDAV server.

**You need:** **[CalDAV Calendar](/docs/apps/caldav)** connected and chosen as the write target.

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Open **Calendar Writer** and remove or uninstall it.

### What changes afterward

New changes in Hacado no longer create or update events on that target calendar through Calendar Writer. Existing events already written may stay on the calendar until you delete them manually.

### Outside Hacado

The calendar you wrote to (Google, Microsoft, your CalDAV host) still holds whatever was created there. Removing Calendar Writer in Hacado does not bulk-delete those past events.
