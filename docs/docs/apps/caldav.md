---
sidebar_position: 13
description: Connect a CalDAV calendar with a server address and sign-in.
---

# CalDAV Calendar

**CalDAV** is a standard way to host calendars on a server (some business mail hosts, Nextcloud-style setups, or specialist providers use it). Hacado can connect with a server URL plus sign-in, then read and write appointments like other calendar Apps.

## Adding the App

1. Collect the **CalDAV server URL**, username, and password (or app password) from your provider’s documentation.
2. Open **Apps**, then **Store**, and install **CalDAV Calendar**.
3. Enter the fields. Use **Test** or save, then fix any errors about the URL, TLS, or wrong password.
4. Choose the calendar on that server where Hacado should work, when the picker appears.

Connection errors are often wrong port, encryption type, or a host that blocks outside access. Try **[Apps troubleshooting](/docs/apps/troubleshooting)** and your provider’s support article.

### Good to know

Self-signed certificates can fail until the host uses a normal trusted certificate chain (for example LetsEncrypt).

## Usage

### Use a calendar you host yourself

**Use this when:** Policy says customer data stays on your infrastructure.

**You need:** A CalDAV server that allows Hacado to create and update events, not read-only locks.

### Add a mailbox calendar that speaks CalDAV

**Use this when:** Your vendor gives you a CalDAV URL instead of Google or Outlook.

**You need:** Accurate server details and quotas that are not full.

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Open **CalDAV Calendar** and disconnect or uninstall.

### What changes afterward

Hacado stops syncing with that server. Hacado clears stored credentials for that connection according to product policy.

### Outside Hacado

Change or revoke the password you shared so nothing else can use it. Past events stored on your server remain until you delete them there.
