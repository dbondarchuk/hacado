---
sidebar_position: 16
description: Set week-by-week work hours so booking shows real availability.
---

# Weekly schedule

Weekly schedule controls **when you accept bookings** as an optional app on top of your **default** schedule in settings. Exceptions live only in this app:

1. **Company holidays** — hard closures for everyone (members cannot reopen)
2. **Company hours** — reduced or different open hours for the week (members may still override)
3. **Member** exceptions — one staff member’s overrides

Clearing shifts on the company calendar is **not** a holiday. Use **Company holidays** to lock days closed. The booking engine uses the default schedule, then applies days this app returns. Only days that differ from the parent layer are stored.


## Adding the App

1. Open **Apps**, then **Store**, and install **Weekly schedule**.
2. Open the weekly schedule screens from **Apps** or scheduling.
3. Choose **Company (all members)** or a team member, pick the week, set open hours, and save.

If the grid will not save, see **[Apps troubleshooting](/docs/apps/troubleshooting)**.

### Good to know

Your workspace **time zone** should be correct in settings. Wrong time zones create odd gaps on the public booking page.

## Usage

### Set normal business hours

**Use this when:** You open and close at steady times most weeks.

**You need:** Edit the **default** schedule in settings for the recurring pattern. Use weekly schedule only for exceptions.

### Handle a company holiday

**Use this when:** The whole business is closed and nobody should take bookings.

**You need:** Select **Company (all members)**, open **Company holidays**, and toggle the closed days (or **Close whole week**). Members cannot reopen holiday days.

### Handle reduced company hours

**Use this when:** Company hours change for a week, but some staff may still work different times (for example evenings).

**You need:** Select **Company (all members)** and edit the grid. Leave holidays unmarked. Then select a member and set their own hours if needed.

### Handle one person’s week

**Use this when:** One staff member differs from the company/default pattern.

**You need:** Select that member in the scope dropdown and edit their week. Shift colors (and badges on mobile) show which layer each day comes from (Default / Company / Member / Holiday).

### Copy or repeat a week

**Use this when:** Several future weeks should match a custom pattern you already built for the current scope.

**You need:**

- **Copy** writes a one-off week (even if the source week is part of a series).
- **Repeat** stores **one** recurring exception (interval + until), not a copy per week. The UI badge shows when the current week is in a series.
- Editing a week under a series only overrides that week. Other weeks keep the series.
- A newer Repeat wins where series overlap. “Replace existing” clears one-off week overrides in the new occurrence set only.
- **Reset this week** removes a one-off override and/or punches the week out of the series. **Remove recurring schedule** deletes the whole series.
- **Reset all from this week** clears week overrides from that week onward and clips or deletes recurring series accordingly.

Upgrading from the pre-multiuser app converts old `weekly-schedules` weeks into company exceptions (empty days become holidays).

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Remove **Weekly schedule** only if your workspace allows it.

### What changes afterward

Booking falls back to the default schedule only. Export or screenshot important weeks before you remove it if your team relies on them.
