---
sidebar_position: 3
description: Point your own web address so clients reach your Hacado booking pages.
---

# Connect your own web address

By default Hacado gives you a booking link that includes your workspace name - for example **`https://yourname.hacad.meo`**. Optional **Own domain** (custom domain) keeps that experience behind a name you buy from a registrar, such as **`www.yourbusiness.com`**.

## Before you begin

Buy the domain yourself from whichever company sells domain names - Hacado does not sell registrations. Gather login access for that registrar’s **DNS control panel**. DNS is simply where you tell the world which computer answers for your chosen name.

## Where to plug the domain inside Hacado

1. Sign in and open **Settings** - **Brand**.
2. Stay on tabs until you reach **Website** styling - often called **Website** settings within Brand. Scroll to the panel titled similarly to **Your Hacado address** showing your current workspace link plus a button like **Link my own domain** or **Connect custom domain**.

![Custom domain dialog start](/img/placeholders/domain-connect-dialog.svg)

3. Follow the prompts to type **only the hostname** (`www.yoursite.com` or `booking.yoursite.com`) depending on guidance shown.

Hacado may display **DNS directions** explaining an **address (A-type) record** pointing at Hacado’s approved server address. Leave that browser tab open - you will reuse the IP or target string when switching to your registrar’s site.

![DNS helper text inside Hacado](/img/placeholders/domain-dns-instructions.svg)

## What to do at your domain seller

Inside the registrar dashboard:

1. Locate **DNS**, **Zones**, or **Manage records**.
2. Add - or edit - the record Hacado asked for (**A** pointing to Hacado’s published address is common).
3. Remove conflicting records for that same hostname (`CNAME`s or stray `A` rows competing for the identical name confuse browsers).
4. Save.

DNS propagation can take anywhere from minutes to a day; small delays are normal.

## Removing or changing the mapping

Returning to **Settings** - **Brand** - booking address area:

- Disconnect or remove the mapping if you retire the vanity name entirely.
- Re-run the wizard if you relocate to another hostname entirely.

Removing only Hacado’s side frees that domain for other uses; it does not cancel your purchase at the registrar.

## When to ask for help

If your registrar offers hand-holding, ask them to “point this hostname to the address Hacado listed.” If everything looks perfect yet the site refuses to load overnight, pause and retry - timing issues happen - or contact Hacado support with screenshots of Hacado’s instructions and what you entered externally.
