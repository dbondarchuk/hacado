---
sidebar_position: 28
description: Email customers when they join your waitlist, and notify them when a matching time opens.
---

# Customer waitlist notifications

Works together with **[Waitlist](/docs/apps/waitlist)**. After you turn it on, Hacado can email **the customer** who joined, and - when a matching time frees up - email and/or SMS them a signed book link and a leave link.

Staff emails (assigned team member, coordinators and above) live on **[Waitlist](/docs/apps/waitlist)** settings.

## Adding the App

1. Install **[Waitlist](/docs/apps/waitlist)** first so the waitlist captures names and details.
2. Connect **[SMTP](/docs/apps/smtp)** or whichever option your workspace uses until “email sender configured” banners clear. Connect an SMS sender if you want slot-opened texts.
3. Open **Apps**, then **Store**, and install **Customer waitlist notifications**. Install creates the new-entry email, slot-opened email, slot-opened SMS, and leave-confirmation SMS templates, assigns the two emails, turns slot notifications on, points book links at the `book` page when it exists, and sets a 3-hour cooldown plus a 15-minute exclusive-access window, then opens the settings page.
4. Review those templates on the settings page. Clear the new-entry email template if you do not want join emails. SMS templates are created but not assigned until you choose them.
5. Save and add a pretend waitlist entry to test the customer mail. Cancel or reschedule an appointment (or change hours) to test slot-opened offers.

Problems? See **[Apps troubleshooting](/docs/apps/troubleshooting)**.

### Good to know

Some regions treat unsolicited mail and SMS strictly. Decide with counsel whether these messages are transactional or marketing where you operate.

## Usage

### Send “you are on the list” reassurance

**Use this when:** People worry their submission vanished.

**You need:** Warm copy plus honest timing on when you normally reach out.

### Offer a freed time (FIFO)

When an appointment is canceled, declined, or marked no-show, when a booking is rescheduled (the old window), when working hours change, or when a team member’s connected calendar sources change, the app looks for the oldest matching waitlist request and sends the configured email and/or SMS.

Matching uses the same staff, a duration that fits the freed window, and either “as soon as possible” or the chosen dates plus morning (before 12:00), afternoon (12:00–16:00), or evening (16:00+) **for the offered start**, not the canceled booking’s start. If a 3-hour appointment is canceled, a 30-minute waitlist request is offered the **earliest bookable start inside that hole** that matches prefs (and is after the workspace’s minimum booking lead time). `{{#hasOtherTimes}}` is true when more matching starts remain in the hole. The same customer is not notified about the same start twice.

The service on the canceled or moved booking does not have to match the waitlist request; the offer is for the customer’s own service at that opened time.

The current person has exclusive access for the minutes you configured (0 offers the next person immediately). A cooldown prevents the same request from being offered again too soon. Book and leave links share one short `w` token. Point book links at a page that uses the **Waitlist** booking block so it can load the offer from the Waitlist app and pass the token as appointment data; booking then dismisses that waitlist request. Customers can also reply with the SMS keyword (default `REMOVE`) to leave that request.

Slot-opened templates should branch with `{{#isMorning}}` / `{{#isAfternoon}}` / `{{#isEvening}}` so each language can use its own wording (afternoon is 12:00–16:00). Use `{{#hasOtherTimes}}` when other starts in the same hole are also free. `{{slotTimeOfDay}}` is a short localized label if you need one. `{{slotDateTime.full}}` is still the exact offered start.

Leave links redirect back to the booking page with a confirmation toast. Customers can also review and leave waitlist requests in **[My Cabinet](/docs/apps/my-cabinet)** when that app is installed.

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Remove **Customer waitlist notifications**.

### What changes afterward

Automatic customer join mails and slot-opened offers from this pipeline stop. **Waitlist** itself stays until you uninstall it separately. Staff waitlist emails in Waitlist settings are not affected.
