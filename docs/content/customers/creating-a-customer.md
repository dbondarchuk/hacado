---
description: Manually create a customer with contact details, deposit rules, notes, photo, and also-known-as values.
---

# Creating a customer

Add a customer by hand when someone calls, walks in, or emails before they ever book online. You can also create the record first, then [schedule an appointment](/docs/first-steps/manage-bookings-and-customers) for them.

## Before you start

- Know at least their **Name**, **Email**, and **Phone** - all three are required.
- Prefer the same email and phone they will use on your booking site, so later online bookings match this profile. See [How customers are created](./how-customers-are-created).

## Open the form

1. Open **Customers**.
2. Click **Add New**.

The **New customer** form opens.

![New customer form with contact information and options](/img/customers/create-form.png)

## Contact information

| Field | Required | What it is for |
| --- | --- | --- |
| **Name** | Yes | How the customer appears in lists and messages |
| **Date of birth** | No | Optional birthday for your records |
| **Phone** | Yes | Primary phone; used to match online bookings |
| **Email** | Yes | Primary email; used to match online bookings and send confirmations |

As you type, a summary under the page title shows the name, email, and phone so you can check the record at a glance.

## Photo

1. Click **Change photo**.
2. Pick an image from your assets (or upload one in the picker).
3. Use **Remove** if you want initials instead of a photo.

## Custom deposit requirement

By default the customer follows each service’s deposit rules (and your workspace defaults).

1. Turn on **Custom deposit requirement** to set a rule for this customer only.
2. Choose **Never** (no deposit for this person) or **Always**.
3. If **Always**, set **Deposit amount** as a percent of the appointment price. `100` means the full price is due up front.

![Custom deposit with Always and deposit percent](/img/customers/details-deposit.png)

## Notes

Use **Notes** for private context your team needs (preferences, allergies, how they found you). Only you and your team see notes - clients do not.

## Online booking

**Online booking** is on by default.

Turn it **off** when this person should not book themselves on your site. You can still create appointments for them in the dashboard.

## Also known as

**Also known as** stores alternate **Names**, **Emails**, and **Phones** this person may use. Hacado uses them when matching a new booking to an existing profile.

1. Click **Add name**, **Add email**, or **Add phone**.
2. Enter the alternate value.
3. Use **Remove** on a chip to drop one.

You can leave this empty on create and fill it later when you learn a second email or phone. See [How customers are created](./how-customers-are-created).

## Save

1. Click **Save**.
2. The customer profile opens so you can add appointments, files, or messages.

If validation fails (missing name, invalid email, or incomplete phone), fix the highlighted fields and save again.

### Good to know

- Manual create and online booking use the same matching rules. Reusing the client’s real email and phone avoids duplicate profiles.
- Text message consent is managed on an existing customer’s **Details** tab after you save (attest or revoke). New customers start without SMS consent until you attest or they opt in on booking.
