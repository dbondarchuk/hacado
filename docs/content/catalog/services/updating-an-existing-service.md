---
description: Edit a catalog service’s General settings, tabs, staff, payments, and policies.
---

# Updating an existing service

Change a service when the name, length, price, staff, or policies no longer match how you book. Edits apply the next time someone books that service. Past appointments keep what they already stored.

## Open the service

1. Open **Appointments → Catalog → Services**.
2. Click the service name, or open the row menu and choose **Update**.

![Services list](/img/catalog/services/listing.png)

The form opens on **General**, with the same tabs as create: **Fields**, **Add-ons**, **Staff**, **Payments**, **Duplicates**, **Cancellations**, and **Reschedules**.

## Change General settings

1. Update **Name** or **Short description** when clients should see different wording.
2. Switch **Duration type** between **Fixed** and **Flexible** when the booking length model changes.

![General tab with Fixed duration](/img/catalog/services/create-general-fixed.png)

3. For **Fixed**, edit **Duration** and **Price**.
4. For **Flexible**, edit **Minimum duration**, **Duration max**, **Duration step**, and **Price per hour**.

![General tab with Flexible duration](/img/catalog/services/create-general-flexible.png)

5. Turn **Custom auto confirm** on or off, and choose **Always** or **Never** when it is on.

![Custom auto confirm](/img/catalog/services/custom-auto-confirm.png)

6. Turn **Virtual appointment** on or off.

![Virtual appointment switch](/img/catalog/services/virtual-switch.png)

If you turn it on, each staff member on the service still needs a **Meeting URL provider** on their profile - yours under **Profile** (`/dashboard/users/me/profile`), or a teammate’s under **Settings → Team →** their profile (`/dashboard/settings/team/<memberId>/profile`). See [Creating a new service](./creating-a-new-service#virtual-appointment).

### Good to know

Switching to **Flexible** clears per-member duration overrides on the **Staff** tab. Price overrides stay.

## Fields, Add-ons, and Staff

Use the same controls as when creating:

- **Fields** - add, reorder, or remove field cards. See [Fields](/docs/catalog/fields).

![Fields tab](/img/catalog/services/tab-fields.png)

- **Add-ons** - add, reorder, or remove add-on cards. See [Add-ons](/docs/catalog/addons).

![Add-ons tab](/img/catalog/services/tab-addons.png)

- **Staff** - assign members, set **Price override** and (for Fixed) **Duration override**, and reorder cards. Keep at least one member if clients should still be able to book.

![Staff tab](/img/catalog/services/tab-staff.png)

## Payments, Duplicates, Cancellations, and Reschedules

- **Payments** - turn **Custom deposit requirement** or **Custom tips configuration** on or off, then adjust deposit and tip options.

![Custom deposit on Payments](/img/catalog/services/tab-payments-deposit.png)

![Custom tips on Payments](/img/catalog/services/tab-payments-tips.png)

- **Duplicates** - enable or disable **Check for duplicate bookings**, then update the action, days range, and message.

![Duplicates tab](/img/catalog/services/tab-duplicates.png)

- **Cancellations** - for appointments with or without a deposit, set a **Custom policy** and its rules.

![Cancellations tab](/img/catalog/services/tab-cancellations.png)

- **Reschedules** - set a **Custom policy**, enable rescheduling, and adjust limits and rules.

![Reschedules tab](/img/catalog/services/tab-reschedules.png)

Full create-time detail for each control is in [Creating a new service](./creating-a-new-service).

## Save

1. Click **Save**.

Hacado keeps you on the service page and confirms that your changes were saved.

Updating a service does not change whether it appears on the booking page. Manage that under [Services and packages](/docs/daily-use/appointment-settings-services-packages). The post-create availability dialog appears only when you first create a service.

### Good to know

For a lighter first pass on names and prices, see [Set up your services](/docs/first-steps/set-up-your-services).
