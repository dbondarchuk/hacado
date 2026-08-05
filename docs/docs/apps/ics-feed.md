---
sidebar_position: 12
description: Block time in Hacado using an external calendar link in ICS format.
---

# ICS Feed

If another system gives you a subscribe link to a calendar (often ending in `.ics` or shared as a stable URL), Hacado can read it and treat those events as **busy** time. This helps online booking avoid clashes without a full two-way Google or Outlook connection.

## Adding the App

1. Copy the full **ICS** link from the other calendar or product. It should start with `https://`.
2. Open **Apps**, then **Store**, and install **ICS Feed**.
3. Paste the link where the form asks for the ICS URL.
4. Save and wait for a success message. Open **Installed apps** if you need to edit the link later.

If the calendar never loads, see **[Apps troubleshooting](/docs/apps/troubleshooting)**. Common issues are a wrong URL, a private link Hacado cannot reach, or the host blocking frequent checks.

### Good to know

Some hosts limit how often a link can be refreshed. Very old data in Hacado usually means the feed is slow or blocked.

## Usage

### Show school, side-job, or partner calendars as busy

**Use this when:** You keep another calendar elsewhere but still want Hacado to block those hours.

**You need:** A working ICS URL that stays online and allows Hacado’s servers to fetch it.

### Combine more than one busy source

**Use this when:** Busy time should include several feeds.

**You need:** Either multiple setups if your workspace allows, or one combined feed from the other product.

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Open **ICS Feed** and remove or disconnect that calendar link.

### What changes afterward

Hacado stops using that feed for busy time. It does not delete anything on the calendar that hosts the link.

### Outside Hacado

Turn off sharing at the original calendar if you want the link to die everywhere. Hacado never wrote back to that calendar through this App.
