---
description: Create a catalog add-on with details, fields, and member overrides.
---

# Creating a new add-on

Add an add-on when clients should be able to book an optional extra with a service. After you save it, attach the add-on on the [services](/docs/catalog/services) that should offer it.

## Before you start

- Know the name, short description, duration, and price clients should see.
- Create any [Fields](/docs/catalog/fields) you want to collect for this add-on before you attach them here.
- On a Studio team with more than one member, decide whether any staff need a different price or duration, or cannot offer the add-on.

## Create the add-on

1. Open **Appointments → Catalog → Add-ons**.
2. Click **Add New**.

The **New add-on** form opens with **Details**, **Duration and price**, **Fields**, and **Member overrides**.

![New add-on form with Name and Short description](/img/catalog/addons/create-form.png)

3. Enter a unique **Name**.
4. Enter a **Short description**. Use the markdown editor for formatting clients see during booking.
5. Under **Duration and price**, set **Duration** (hours and minutes) and **Price**.
6. Optionally add fields and member overrides (see below).
7. Click **Save**.

Hacado opens the saved add-on so you can keep editing if needed.

## Fields

Attach catalog fields when this add-on needs its own booking questions.

1. Under **Fields**, click **Add a new item**.
2. Open **Field** and pick a field from the catalog.
3. Turn **Required** on if clients must answer before they can finish booking, or leave it off if the answer is optional. If field's own configuration marks it as required, field will be required regardless of addon's field requirement.
4. Use the trash control on a field card to remove it. Confirm in the dialog if asked.
5. Drag the grip on a field card to reorder when you have more than one.

### Good to know

A field must already exist under [Catalog → Fields](/docs/catalog/fields). Creating a field there does not put it on this add-on until you add it here.

## Member overrides

By default, any member who can perform the parent service can offer this add-on at the base price and duration. Add an override only to set a different price or duration for one member, or to mark that they cannot offer this add-on.

1. Under **Member overrides**, click **Add override**.
2. Open **Member** and pick a team member - for example a second photographer on a Studio plan.
3. Leave **Cannot offer this add-on** off to set overrides.
4. Optionally enter a **Price override** and a **Duration override**.
5. Or turn **Cannot offer this add-on** on so that member cannot offer the add-on during booking. Price and duration overrides hide while that switch is on.

![Member override for Jordan Lee with price and duration](/img/catalog/addons/member-overrides.png)

![Member override with Cannot offer this add-on on](/img/catalog/addons/member-unavailable.png)

6. To remove an override, click the trash control on that card and confirm **Delete** in the dialog, or **Cancel** to keep it.

### Good to know

- You can also start from an existing add-on: open the row menu and choose **Clone**, then edit and save.
- An add-on is not offered on a booking until you attach it on a service.
- Each member can appear in at most one override card on the same add-on.
