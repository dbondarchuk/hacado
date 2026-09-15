---
sidebar_position: 25
description: Send outgoing email through your Resend account via OAuth instead of Hacado shared mail only.
---

# Resend

Resend is a modern transactional email API. Connecting Resend lets confirmations, reminders, and other customer email appear to come **from your verified domain** while Hacado sends through your Resend account (no API key paste in the admin UI).

## Adding the App

### One-time platform setup (operators)

Resend has no OAuth-client dashboard. Register a confidential client once per environment with the Register API, then store the returned credentials as secrets. The `client_secret` is shown **only once**.

```bash
curl -X POST 'https://api.resend.com/oauth/register' \
  -H 'Content-Type: application/json' \
  -d '{
    "client_name": "Hacado",
    "redirect_uris": ["https://<ADMIN_HOST>/apps/oauth/resend/redirect"],
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "token_endpoint_auth_method": "client_secret_basic",
    "scope": "emails:send"
  }'
```

Set:

- `RESEND_OAUTH_CLIENT_ID`
- `RESEND_OAUTH_CLIENT_SECRET`

Redirect URI must match `{ADMIN_URL}/apps/oauth/resend/redirect`. Add extra URIs (up to 10) for local/staging hosts if needed. Do **not** call register on each org install - Hacado is one remote client; orgs only authorize it.

These OAuth secrets are separate from platform system mail (`RESEND_API_KEY` / `EMAIL_PROVIDER=resend`).

### In Hacado

1. In Resend, verify the domain you will send from (DNS / DKIM as Resend documents).
2. Open **Apps**, then **Store**, and install **Resend**.
3. Click **Connect**, approve access on Resend’s consent screen (`emails:send` only).
4. Enter **Sender email** (must be on a verified domain) and optional **Sender name**, then save.
5. Under **Default apps**, set Resend as the email sender if it is not selected automatically.

Mis-typed From addresses and unverified domains are the usual failure modes. **[Apps troubleshooting](/docs/apps/troubleshooting)** covers retries.

### Good to know

Access tokens expire after about 15 minutes; Hacado refreshes them automatically. Refresh tokens rotate on every use.

## Usage

### Branded confirmations from `@yourbiz.com`

**Use this when:** Clients should recognise your domain in the sender field without running your own SMTP server.

**You need:** A Resend account with that domain verified, and the same address configured as Sender email in the app.

### High volume reminders on busy days

**Use this when:** You anticipate many appointment updates in one burst.

**You need:** Sending limits high enough on your Resend plan.

## Removing the App

1. Open **Apps**, then **Installed apps**.
2. Disconnect **Resend**.

### What changes afterward

Outbound customer mail falls back to whatever default Hacado uses when no email-sender app is set. You can also revoke access from the Resend dashboard.

### Outside Hacado

Revoke the Hacado OAuth grant in Resend if you no longer use the integration.
