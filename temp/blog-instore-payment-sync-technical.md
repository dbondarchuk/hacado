# Syncing In-Store Card Payments Into Hacado: PayPal, Square, Stripe, and the Payments Inbox

**Dmytro Bondarchuk** | June 12, 2026 | 18 min read

Hacado already handled online deposits: a client books, pays through PayPal/Square/Stripe on your booking page, and the payment lands on the appointment. That path is straightforward because we create the payment intent, we own the metadata, and we know exactly which appointment the money belongs to.

In-store is different. A client taps a card on your PayPal reader, Square Terminal, or Stripe reader at the front desk. That transaction lives in the processor's world first. Your booking calendar does not automatically know about it unless you build a bridge.

This post is about that bridge: how we ingest in-store card payments into a **Payments Inbox**, auto-match them to appointments, and let staff confirm or reassign. PayPal was the first integration and the hardest one: **PayPal does not send webhooks for in-store reader charges**, so we had to build polling on top of Transaction Search. Square and Stripe followed with a simpler webhook-only model.

---

## The problem we were solving

Service businesses on Hacado often run a split payment model:

1. Client pays a **deposit online** when booking (we already track this).
2. Client pays the **balance in person** at the appointment (we did not track this automatically).

Without sync, owners reconcile manually: export from Square, scroll the appointment list, guess which $85 charge was Sarah's haircut. That does not scale, and it gets worse when tips are involved.

We wanted:

- In-store processor charges to appear in Hacado within minutes.
- A **suggested appointment** when the amount and time line up.
- Staff review before money is permanently attached (matched / unmatched / confirm / reject).
- **No double-counting** of online checkout payments we already recorded.

The shared destination is `SyncedPaymentsService` and a MongoDB `synced-payments` collection per organization. Payment apps normalize provider payloads into a `SyncedPaymentTransaction` and call `ingest()`.

---

## Architecture overview

```
┌─────────────────────┐   ┌──────────────────────┐   ┌─────────────────────┐
│ PayPal              │   │ Square / Stripe      │   │ SyncedPaymentsService│
│ Transaction Search  │   │ platform webhooks    │──▶│ ingest() + matcher  │
│ (hourly poll)       │──▶│                      │   └──────────┬──────────┘
└─────────────────────┘   └──────────────────────┘              │
                                                                 ▼
                                                      ┌─────────────────────┐
                                                      │ Payments Inbox (UI) │
                                                      │ matched / unmatched │
                                                      └─────────────────────┘
```

Each payment app implements the same ingest contract:

```ts
// packages/types/src/booking/synced-payment.ts (simplified)
export type SyncedPaymentTransaction = {
  appId: string;
  appName: string;
  externalId: string; // provider capture/charge/payment id (dedup key)
  orderId?: string;
  amount: number;
  currency: string;
  transactionTime: Date;
  fees?: PaymentFee[];
  providerSplit?: { paymentAmount: number; tip: number };
  raw?: unknown;
};
```

`ingest()` is idempotent on `externalId`, finds appointment candidates in a configurable time window, and either parks the row as `unmatched` or auto-attaches as `matched` with generated payment records.

---

## PayPal: webhooks do not work for in-store payments

PayPal was the reference implementation. The core insight came early: **PayPal only delivers webhooks for payments created by the REST app that registered the listener.**

Hacado online deposits go through our PayPal client: we create the order, the client pays, we get a capture we already own. A front-desk tap on a PayPal/Zettle reader does not. That charge is initiated by the POS stack against the merchant account. It never touches Hacado's client id. PayPal therefore never posts `PAYMENT.CAPTURE.COMPLETED` to our webhook URL for those transactions.

Square and Stripe do not have this limitation at the merchant-account level: a platform webhook sees activity on the connected merchant account regardless of which API call created the payment. PayPal scopes notifications to the app.

So in-store sync for PayPal is **poll-first**. We still register a per-install webhook (useful for captures that do flow through our API and for symmetry with the ingest pipeline), but the path that actually discovers reader charges is an hourly job over Transaction Search.

Both paths call the same function: `ingestInStoreCapture()`.

### Per-organization webhooks (online only in practice)

Unlike Square and Stripe, PayPal webhooks are registered **per connected app install**:

```
/apps/{organizationId}/{appId}/webhook
```

When a merchant enables in-store sync, we call PayPal's Notifications API, register `PAYMENT.CAPTURE.COMPLETED`, and store the returned `webhookId` for signature verification.

```ts
// packages/app-store/src/apps/paypal/service.ts
const IN_STORE_SYNC_EVENT_TYPES = ["PAYMENT.CAPTURE.COMPLETED"];

protected getWebhookUrl(appId: string): string {
  return `${getAdminUrl()}/apps/${this.props.organizationId}/${appId}/webhook`;
}
```

The handler verifies the signature, parses capture events, and calls `ingestInStoreCapture()`. In production testing, **reader charges never showed up here.** Online checkout captures usually do, but those are already recorded through our payment-intent flow and get filtered out by dedup (see below). For in-store, treat the webhook as dead weight you keep registered, not the sync mechanism.

### Transaction Search: the real ingestion path

The hourly BullMQ job per connected PayPal app calls PayPal's **Transaction Search** reporting API over a rolling 24-hour window:

```ts
// packages/app-store/src/apps/paypal/const.ts
export const PAYPAL_TRANSACTION_SYNC_INTERVAL_SECONDS = 60 * 60;
export const PAYPAL_TRANSACTION_SYNC_LOOKBACK_SECONDS = 24 * 60 * 60;
```

The query filters to successful, balance-affecting records and requests `cart_info` for tip splitting:

```ts
// packages/app-store/src/apps/paypal/client.ts (simplified)
transaction_status: "S",
balance_affecting_records_only: "Y",
fields: "transaction_info,store_info,cart_info",
```

For each row we extract a capture id and then **verify it exists** with `GET /v2/payments/captures/{id}` before ingesting.

This verification step matters. Transaction Search regularly returns rows whose capture id **does not resolve** to a real capture (404). We call these phantoms and skip them:

```ts
// packages/app-store/src/apps/paypal/transaction-sync.ts
if (!verifiedCapture) {
  phantom += 1;
  logger.debug(
    { captureId, statusCode: captureError?.statusCode },
    captureError?.statusCode === 404
      ? "Skipping phantom PayPal transaction (capture not found)"
      : "Skipping PayPal transaction (capture lookup failed)",
  );
  continue;
}
```

If we trusted the search index blindly, we would ingest garbage or fail mid-batch. The poll path has to be skeptical even though it is our only reliable source for reader payments.

### Why polling instead of webhooks?

1. **App-scoped notifications.** PayPal does not fan out merchant-account events to every registered webhook. Only payments originated by your REST app trigger events on your listener. In-store reader taps are outside that boundary.
2. **Merchant-account visibility.** Transaction Search lists balance-affecting activity on the connected merchant account, which is exactly what we need for POS reconciliation.
3. **Richer metadata.** The search response includes `cart_info` for tip vs service split. Reader webhooks would not arrive anyway; this is where we get line-item detail.
4. **Overlap is fine.** If a webhook ever fires for a capture we also pick up in the poll, dedup on `externalId` makes ingestion idempotent.

The 24-hour lookback plus hourly interval is a deliberate tradeoff: late-arriving search rows and missed job runs still get a second chance without keeping unbounded history.

### Filtering: what we ingest and what we skip

`ingestInStoreCapture()` applies the same gates for webhook and poll:

| Check                                                                  | Why                                      |
| ---------------------------------------------------------------------- | ---------------------------------------- |
| `payments` collection already has this `externalId` (capture or order) | Online checkout already finalized        |
| `payment-intents` collection has this `externalId`                     | Hacado checkout in flight or completed |
| `synced-payments` already has this `externalId`                        | Idempotent re-delivery                   |
| `amount <= 0`                                                          | Noise / invalid                          |
| Capture status not `COMPLETED` (poll path)                             | Not settled yet                          |

Online PayPal checkouts create orders and captures we already own. In-store POS taps do not go through our booking payment intent flow, so they pass these filters.

### Tip splitting from `cart_info`

PayPal in-store totals often include a gratuity. When `cart_info.item_details` is present, we sum line items and treat the remainder of the gross as tip:

```ts
// packages/app-store/src/apps/paypal/transaction-sync.ts
export function extractCartSplit(detail, transactionAmount) {
  // sum item totals from cart_info
  // tip = gross - cartTotal (when consistent within 1 cent)
}
```

That `providerSplit` flows into `SyncedPaymentsService` so staff see service vs tip separately in the inbox, not only a single lump sum.

### Fees

On the poll path we read `seller_receivable_breakdown` from the verified capture object after GET. The webhook path can backfill from the order when the payload is thin, but for in-store that branch rarely runs.

---

## The matcher: how appointments get suggested

Once a transaction is normalized, provider-agnostic logic takes over in `SyncedPaymentsService.ingest()`.

1. **Idempotency** on `externalId`.
2. **`findCandidates()`** loads appointments ending within `matchWindowMinutes` of the transaction time (default 120 minutes in code, configurable per app).
3. Skip appointments with **no remaining balance** (already fully paid online).
4. Score each candidate:
   - **Time score:** how close the appointment end time is to the transaction time.
   - **Amount score:** exact balance match scores highest; partial payments and overpayments (tips) score lower but can still win.
5. Best candidate above threshold → status `matched` with auto-created payment + tip rows. No candidate → `unmatched` queue.

```ts
// packages/services/src/synced-payments.service.ts (simplified)
const score = round2(timeScore * 0.5 + amountScore * 0.5);
```

Staff can confirm, reassign, edit amounts, or reject from the inbox UI. Reject removes the auto-created payments.

---

## Square: OAuth + platform webhook

Square was simpler to wire because Hacado already used **Square OAuth** and a **single platform webhook** at `/apps/webhook/square` (signature verified with `SQUARE_APP_WEBHOOK_SIGNATURE_KEY`).

### Ingest trigger

We listen for `payment.updated` with `status === COMPLETED`. The handler:

1. Keeps the existing path that updates **fees** on known online payments.
2. Resolves **all** connected apps with matching `data.merchantId` (multiple orgs can share one Square merchant account).
3. For apps with `enableInStoreSync`, fetches full payment (+ order when present) and calls `ingestInStorePayment()`.

No hourly poll. Square's webhook delivery has been reliable enough in testing, and the payment object is available immediately via GET if the webhook body is thin.

### Filtering

Same idea as PayPal:

- Skip if `externalId` already exists on a Hacado payment or intent (online checkout).
- Skip if already in `synced-payments`.

### Tip split

Square orders expose line items. We sum `line_items` totals vs gross amount; remainder is tip (`extractOrderSplit` in `map-payment.ts`).

### Defaults on connect

`afterOAuthConnected` sets `enableInStoreSync: true` and `matchWindowMinutes: 240` when unset. `processRedirect` preserves existing sync preferences on reconnect.

---

## Stripe: Connect + `charge.succeeded`

Stripe follows the same inbox contract with Connect-specific details.

### Platform webhook

Static endpoint `/apps/webhook/stripe`. Connect events include `event.account` (the connected account id). We look up **every** connected app with `data.accountId` matching that value.

### Ingest trigger

On `charge.succeeded`, after the existing fee-sync branch for online checkouts, we ingest external charges when:

- `enableInStoreSync` is on for that app.
- The charge is **not** a Hacado online checkout (PaymentIntent metadata contains `organizationId` + `hacadoIntentId`).

```ts
// packages/app-store/src/apps/stripe/map-charge.ts
export function isHacadoCheckoutPaymentIntent(metadata) {
  return Boolean(metadata?.organizationId && metadata?.hacadoIntentId);
}
```

We retrieve the charge with expanded `balance_transaction` for fees. Optional tip split from `amount_details.tip` when Stripe exposes it on Terminal charges.

### No poll

Same reasoning as Square: webhook + retrieve is sufficient for our use case.

---

## Comparison table

|                        | PayPal                                | Square                              | Stripe                           |
| ---------------------- | ------------------------------------- | ----------------------------------- | -------------------------------- |
| Auth model             | REST credentials per org              | OAuth per org                       | Connect OAuth per org            |
| Webhook scope          | Per install URL                       | Platform                            | Platform (Connect)               |
| Ingest trigger         | Hourly Transaction Search poll (webhook registered but not used for reader charges) | `payment.updated` | `charge.succeeded` |
| Org lookup             | From URL                              | `merchant_id` on event              | `account` on event               |
| Online checkout filter | payment/intent by capture or order id | payment/intent by Square payment id | PI metadata                      |
| Extra verification     | GET capture after Transaction Search  | GET payment/order                   | GET charge + balance_transaction |
| Tip split source       | `cart_info` line items                | Order line items                    | `amount_details.tip`             |
| In-store sync default  | Opt-in in settings                    | On by default at connect            | On by default at connect         |

---

## What I would do differently next time

**Start with the inbox contract, not the provider.** Defining `SyncedPaymentTransaction` and `ingest()` first made Square and Stripe mostly mapping exercises.

**Read each processor's notification model before assuming webhooks.** PayPal app-scoping killed a webhook-only design on day one. Square and Stripe merchant-level events made the same inbox reachable without polling.

**Treat PayPal Transaction Search as untrusted input.** The phantom capture problem would have caused subtle data bugs if we skipped verification.

**Plan for shared merchant accounts early.** Square and Stripe webhooks are platform-scoped; one event may map to multiple Hacado organizations. We query all matching connected apps and ingest per org with org-scoped dedup.

**Keep online and in-store paths visibly separate.** The metadata/intent checks are boring but essential. One missed filter double-books revenue.

---

## Try it

If you run a Hacado organization with PayPal, Square, or Stripe:

1. Connect the processor in **Apps**.
2. Enable in-store sync (PayPal: toggle in app settings; Square/Stripe: on by default).
3. Open **Financials → Payments Inbox** after your next in-person card payment.

The inbox is the same UI regardless of processor. The apps only disagree on how they discover charges.

---

_Hacado is the appointment scheduling platform I build at [hacado.com](https://hacado.com). This blog runs on it._
