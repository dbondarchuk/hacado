import type { EventEnvelope } from "@hacado/types";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FORM_RESPONSE_CREATED_EVENT_TYPE } from "../forms/models/events";
import { GIFT_CARD_STUDIO_PURCHASE_CREATED_EVENT_TYPE } from "../gift-card-studio/models/events";
import { WAITLIST_ENTRY_CREATED_EVENT_TYPE } from "../waitlist/models/events";
import {
  gaPublicContextFromSource,
  mapGa4Event,
  stableGaClientId,
  stableGaSessionId,
} from "./map-ga4-event";

function envelope(
  type: string,
  payload: unknown,
  source: EventEnvelope["source"] = { actor: "customer", actorId: "c1" },
): EventEnvelope {
  return {
    id: "evt-1",
    type,
    payload,
    organizationId: "org-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    source,
  };
}

describe("stableGaClientId", () => {
  it("returns a stable dotted numeric id", () => {
    const a = stableGaClientId("org:customer");
    const b = stableGaClientId("org:customer");
    assert.equal(a, b);
    assert.match(a, /^\d+\.\d+$/);
  });
});

describe("stableGaSessionId", () => {
  it("returns a stable positive integer", () => {
    const a = stableGaSessionId("org:customer");
    const b = stableGaSessionId("org:customer");
    assert.equal(a, b);
    assert.ok(a > 0);
    assert.equal(Number.isInteger(a), true);
  });
});

describe("gaPublicContextFromSource", () => {
  it("returns only the matching app context", () => {
    const source: EventEnvelope["source"] = {
      actor: "customer",
      actorId: "c1",
      context: {
        public: {
          "ga-app": { clientId: "1.2", sessionId: 99 },
          "other-app": { foo: "bar" },
        },
      },
    };

    assert.deepEqual(gaPublicContextFromSource(source, "ga-app"), {
      clientId: "1.2",
      sessionId: 99,
    });
    assert.deepEqual(gaPublicContextFromSource(source, "missing"), {});
  });
});

describe("mapGa4Event", () => {
  it("maps paid appointment.created to purchase", () => {
    const mapped = mapGa4Event(
      envelope("appointment.created", {
        appointment: {
          _id: "appt-1",
          customerId: "cust-1",
          totalPrice: 50,
          option: { _id: "opt-1", name: "Haircut" },
        },
        confirmed: true,
      }),
      "USD",
    );

    assert.equal(mapped?.name, "purchase");
    assert.equal(mapped?.clientIdSeed, "org-1:cust-1");
    assert.equal(mapped?.params.event_id, "evt-1");
    assert.equal(mapped?.params.transaction_id, "appt-1");
    assert.equal(mapped?.params.value, 50);
    assert.equal(mapped?.params.currency, "USD");
    assert.equal(mapped?.params.engagement_time_msec, 100);
    assert.equal(mapped?.params.session_id, stableGaSessionId("org-1:cust-1"));
    assert.deepEqual(mapped?.params.items, [
      {
        item_id: "opt-1",
        item_name: "Haircut",
        price: 50,
        quantity: 1,
      },
    ]);
  });

  it("maps free appointment.created to purchase with zero value", () => {
    const mapped = mapGa4Event(
      envelope("appointment.created", {
        appointment: {
          _id: "appt-2",
          customerId: "cust-1",
          totalPrice: 0,
          option: { _id: "opt-1", name: "Consult" },
        },
        confirmed: true,
      }),
      "USD",
    );

    assert.equal(mapped?.name, "purchase");
    assert.equal(mapped?.params.value, 0);
    assert.equal(mapped?.params.currency, "USD");
  });

  it("prefers browser client id from public event context", () => {
    const mapped = mapGa4Event(
      envelope(
        "appointment.created",
        {
          appointment: {
            _id: "appt-4",
            customerId: "cust-1",
            totalPrice: 10,
            option: { _id: "opt-1", name: "Haircut" },
          },
          confirmed: true,
        },
        { actor: "customer", actorId: "c1" },
      ),
      "USD",
      { clientId: "111222333.444555666" },
    );

    assert.equal(mapped?.clientId, "111222333.444555666");
  });

  it("reads browser client id for waitlist and form events", () => {
    const waitlist = mapGa4Event(
      envelope(
        WAITLIST_ENTRY_CREATED_EVENT_TYPE,
        {
          entry: {
            _id: "wl-2",
            customerId: "cust-1",
            option: { _id: "opt-1", name: "Massage" },
          },
        },
        { actor: "customer" },
      ),
      "USD",
      { clientId: "1.2" },
    );
    assert.equal(waitlist?.clientId, "1.2");

    const form = mapGa4Event(
      envelope(
        FORM_RESPONSE_CREATED_EVENT_TYPE,
        {
          formResponse: { _id: "fr-2", formId: "f-1" },
          form: { _id: "f-1", name: "Contact" },
        },
        { actor: "visitor", actorName: "Anon" },
      ),
      "USD",
      { clientId: "3.4" },
    );
    assert.equal(form?.clientId, "3.4");
  });

  it("skips admin-created appointments", () => {
    const mapped = mapGa4Event(
      envelope(
        "appointment.created",
        {
          appointment: {
            _id: "appt-3",
            customerId: "cust-1",
            totalPrice: 10,
            option: { _id: "opt-1", name: "Haircut" },
          },
          confirmed: true,
        },
        { actor: "member", actorId: "m1" },
      ),
      "USD",
    );

    assert.equal(mapped, undefined);
  });

  it("maps waitlist.entry.created", () => {
    const mapped = mapGa4Event(
      envelope(WAITLIST_ENTRY_CREATED_EVENT_TYPE, {
        entry: {
          _id: "wl-1",
          customerId: "cust-1",
          option: { _id: "opt-1", name: "Massage" },
        },
      }),
      "USD",
    );

    assert.equal(mapped?.name, "generate_lead");
    assert.equal(mapped?.params.lead_type, "waitlist");
    assert.equal(mapped?.params.transaction_id, "wl-1");
  });

  it("maps gift card purchase", () => {
    const mapped = mapGa4Event(
      envelope(GIFT_CARD_STUDIO_PURCHASE_CREATED_EVENT_TYPE, {
        appId: "app-1",
        purchase: {
          _id: "pur-1",
          designId: "des-1",
          designName: "Holiday",
          amountPurchased: 100,
          giftCardCode: "SECRET",
        },
      }),
      "EUR",
    );

    assert.equal(mapped?.name, "purchase");
    assert.equal(mapped?.params.value, 100);
    assert.equal(mapped?.params.currency, "EUR");
    assert.ok(
      !JSON.stringify(mapped).includes("SECRET"),
      "must not include gift card code",
    );
  });

  it("maps customer package issued on customer channel only", () => {
    assert.equal(
      mapGa4Event(
        envelope("customerPackage.issued", {
          customerPackage: {
            _id: "cp-1",
            customerId: "cust-1",
            packageId: "pkg-1",
            name: "10 sessions",
            price: 200,
            channel: "admin",
          },
        }),
        "USD",
      ),
      undefined,
    );

    const mapped = mapGa4Event(
      envelope("customerPackage.issued", {
        customerPackage: {
          _id: "cp-1",
          customerId: "cust-1",
          packageId: "pkg-1",
          name: "10 sessions",
          price: 200,
          channel: "customer",
        },
      }),
      "USD",
    );

    assert.equal(mapped?.name, "purchase");
    assert.equal(mapped?.params.transaction_id, "cp-1");
  });

  it("maps form.response.created", () => {
    const mapped = mapGa4Event(
      envelope(
        FORM_RESPONSE_CREATED_EVENT_TYPE,
        {
          formResponse: { _id: "fr-1", formId: "f-1" },
          form: { _id: "f-1", name: "Contact" },
        },
        { actor: "visitor", actorName: "Anon" },
      ),
      "USD",
    );

    assert.equal(mapped?.name, "generate_lead");
    assert.equal(mapped?.params.lead_type, "form");
  });
});
