---
sidebar_position: 30
description: Platform SMS for United States and Canada numbers through Telnyx.
---

# Platform SMS

Hacado sends appointment texts for United States and Canada numbers from one toll-free number. A workspace that still has the Textbelt app selected as its text sender keeps using that app. Consent and STOP opt-out apply before either sender. The country check applies only to the platform number.

## Manual Telnyx setup

1. Create a Telnyx account, then buy and verify one toll-free number for the United States and Canada.
2. Create a messaging profile, assign that number, and set its webhook URL to `https://<app-external-server>/api/webhooks/platform/telnyx/messaging`.
3. Put `TELNYX_API_KEY`, `TELNYX_PUBLIC_KEY`, `TELNYX_FROM_NUMBER`, and `TELNYX_MESSAGING_PROFILE_ID` on admin, notification-sender, and app-external-server.
4. Leave `TEXTBELT_API_KEY` in place for workspaces that still use the Textbelt app.

Optional limits: `SMS_SUPPORTED_COUNTRIES` (default `US,CA`), `SMS_RATE_LIMIT_PER_MINUTE` (default 60), and `SMS_DAILY_CAP` (default 1000).

## What customers see

Every platform text ends with `Txt STOP to unsubscribe`. The first accepted text to a customer phone for a workspace also includes `Msg&data rates may apply. Reply STOP to cancel, HELP for help.` Staff texts do not get that rates sentence. One accepted message costs one SMS credit. A skipped send (no consent, opted out, unsupported country, or over the cap) does not.

Public booking and waitlist forms include an unchecked consent box and links to the Terms, Privacy Policy, and SMS Privacy and Policy on hacado.com. Each text names the business the customer booked with.
