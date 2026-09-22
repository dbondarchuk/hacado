---
sidebar_position: 24
description: Send customers a hosted payment link from Collect payment and track it in existing payment views.
---

# Payment Links

Payment Links lets you send a customer a URL to pay a balance online. The customer opens `/payment` on your site, optionally verifies contact details, and pays with your default payment app (Stripe, Square, or PayPal).

Pending and cancelled payment links appear in the same payment lists as other payments (appointment payments, Financials » Payments). They are **not** counted toward balances or revenue until the customer pays.

## Adding the App

1. Open **Apps** » **Store** and install **Payment Links** (Solo plan or higher) with one click.
2. Connect a payment processor and set it as the **default payment app**.
3. Install seeds email/SMS templates and picks the site’s preferred header/footer (same approach as Blog). The settings form stays open so you can adjust verification, templates, tips, chrome, and expiry:
   - **None** — anyone with the link can pay
   - **Contact match** — customer must enter a matching email or phone
   - **OTP** — customer must complete email/SMS one-time password verification
4. Optionally set how many days a link stays valid.
5. Optionally **enable tips** and configure up to four percentage presets. Customers always see **No tip** (default) and **Custom**, plus your presets.

You also need a default email sender (and SMS sender if you send by text).

## Usage

### Collect payment with a link

1. Open an appointment (or create a payment with a customer).
2. Choose **Collect payment** / **Add payment**.
3. Select method **Payment link** and any payment type (deposit, payment, etc.).
4. If more than one payment-link app is installed, pick which one to use.
5. Choose **Email**, **SMS**, or **Copy link**. For email/SMS, pick the destination if the customer has known aliases.
6. Confirm. A **pending** payment row is created and the link is sent (or copied).

### Resend, copy, or cancel

On a pending payment-link row (payment card or Financials » Payments):

- **Show QR code** — display a scannable code for the customer (copy or download the image)
- **Copy link** — copy the public URL
- **Resend** — send again by email or SMS
- **Cancel** — mark the payment **cancelled** (it stays visible but never counts as paid)

### Customer pays

The customer opens `/payment?id=…`, completes verification if required, optionally adds a tip (if enabled), and pays with your default processor. The same payment row becomes **paid**. Tip is stored on that row as `tipAmount` (included in `amount`), not as a separate tip payment — cash tips can still be recorded separately.

## Good to know

- Processor-native payment links (Stripe Payment Links, etc.) are not used in this version; checkout is Hacado-hosted.
- Pending and cancelled amounts are excluded from appointment balance due, notification totals, and financial overview metrics.
- Tip included on a payment does not reduce the appointment balance; only the service portion does.
- After a link is paid, you can refund it like any other online payment when the default processor (Stripe, Square, or PayPal) supports refunds.
