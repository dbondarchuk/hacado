---
sidebar_position: 24
description: Send outgoing email through your own SMTP mail server instead of Hacado shared mail only.
---

# SMTP

SMTP is the standard path for outbound mail servers. Connecting SMTP lets transactional email (confirmations, reminders, staff notices) appear to come **from your domain** when Hacado supports sending through providers like Google Workspace, Microsoft 365, custom hosts, or transactional vendors.

## Adding the App

1. Collect SMTP **host**, **port**, encryption (TLS vs SSL per host docs), **username**, and **password** or **app password** from your mail provider’s guide.
2. Open **Apps**, then **Store**, and install **SMTP**.
3. Enter the fields exactly as your host describes.
4. Run **Send test email** inside Hacado and check inbox plus spam folders.

Mis-typed passwords, blocked ports, and missing SPF/DKIM/DMARC are the usual suspects. **[Apps troubleshooting](/docs/apps/troubleshooting)** walks through retries.

### Good to know

Consumer Gmail SMTP is often discouraged; many teams use Workspace with an app password or a dedicated transactional sender.

## Usage

### Branded confirmations from `@yourbiz.com`

**Use this when:** Clients should recognise your domain in the sender field.

**You need:** DNS records (often SPF plus DKIM) published and verified according to Hacado and your host.

### High volume reminders on busy days

**Use this when:** You anticipate many appointment updates in one burst.

**You need:** Sending limits high enough from your SMTP provider.

### Sensitive industries with strict mail rules

**Use this when:** Policy requires routing through servers you audit.

**You need:** Appropriate agreements with whoever hosts the mailbox service.

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Remove SMTP credentials by disconnecting **SMTP**.

### What changes afterward

Outbound mail falls back to whatever default Hacado uses when SMTP is unavailable. Scheduled messages queued only for SMTP may stop until you reconnect.

### Outside Hacado

Delete service accounts created only for SMTP and remove Hacado from allowlists once you migrate away.
