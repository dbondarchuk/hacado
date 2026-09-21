import type {
  AppointmentCreatedPayload,
  CustomerPackageIssuedPayload,
  EventEnvelope,
  EventSource,
} from "@hacado/types";
import { createHash } from "node:crypto";
import type { FormResponseCreatedPayload } from "../forms/models/events";
import { FORM_RESPONSE_CREATED_EVENT_TYPE } from "../forms/models/events";
import type { GiftCardStudioPurchaseCreatedPayload } from "../gift-card-studio/models/events";
import { GIFT_CARD_STUDIO_PURCHASE_CREATED_EVENT_TYPE } from "../gift-card-studio/models/events";
import type { WaitlistEntryCreatedEvent } from "../waitlist/models/events";
import { WAITLIST_ENTRY_CREATED_EVENT_TYPE } from "../waitlist/models/events";

export type Ga4Item = {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
};

export type Ga4MappedEvent = {
  name: string;
  params: {
    event_id: string;
    transaction_id?: string;
    value?: number;
    currency?: string;
    lead_type?: string;
    items?: Ga4Item[];
    /** Required for Realtime / engagement reporting via Measurement Protocol. */
    engagement_time_msec: number;
    /** Synthetic session id so MP-only hits appear in Realtime. */
    session_id: number;
  };
  clientIdSeed: string;
};

function isPublicActor(source: EventSource): boolean {
  return source.actor === "customer" || source.actor === "visitor";
}

/** Stable GA-shaped client_id from a seed (not tied to the browser `_ga` cookie). */
export function stableGaClientId(seed: string): string {
  const hash = createHash("sha256").update(seed).digest();
  const part1 = hash.readUInt32BE(0);
  const part2 = hash.readUInt32BE(4);
  return `${part1}.${part2}`;
}

/** Positive numeric session_id (GA4 requires `^\d+$`). */
export function stableGaSessionId(seed: string): number {
  const hash = createHash("sha256").update(`session:${seed}`).digest();
  return (hash.readUInt32BE(0) % 2_147_483_647) + 1;
}

function withReportParams(
  params: Omit<Ga4MappedEvent["params"], "engagement_time_msec" | "session_id">,
  clientIdSeed: string,
): Ga4MappedEvent["params"] {
  return {
    ...params,
    engagement_time_msec: 100,
    session_id: stableGaSessionId(clientIdSeed),
  };
}

export function mapGa4Event(
  envelope: EventEnvelope,
  currency: string,
): Ga4MappedEvent | undefined {
  switch (envelope.type) {
    case "appointment.created": {
      if (envelope.source.actor !== "customer") return undefined;

      const { appointment } = envelope.payload as AppointmentCreatedPayload;
      const value = appointment.totalPrice ?? 0;
      const itemName = appointment.option?.name ?? "Appointment";
      const itemId = appointment.option?._id ?? appointment._id;
      const clientIdSeed = `${envelope.organizationId}:${appointment.customerId ?? appointment._id}`;

      return {
        name: "purchase",
        params: withReportParams(
          {
            event_id: envelope.id,
            transaction_id: appointment._id,
            value,
            currency,
            items: [
              {
                item_id: itemId,
                item_name: itemName,
                price: value,
                quantity: 1,
              },
            ],
          },
          clientIdSeed,
        ),
        clientIdSeed,
      };
    }

    case WAITLIST_ENTRY_CREATED_EVENT_TYPE: {
      if (!isPublicActor(envelope.source)) return undefined;

      const { entry } =
        envelope.payload as WaitlistEntryCreatedEvent["payload"];
      const itemName = entry.option?.name ?? "Waitlist";
      const itemId = entry.option?._id ?? entry._id;
      const clientIdSeed = `${envelope.organizationId}:${entry.customerId ?? entry._id}`;

      return {
        name: "generate_lead",
        params: withReportParams(
          {
            event_id: envelope.id,
            transaction_id: entry._id,
            lead_type: "waitlist",
            items: [{ item_id: itemId, item_name: itemName }],
          },
          clientIdSeed,
        ),
        clientIdSeed,
      };
    }

    case GIFT_CARD_STUDIO_PURCHASE_CREATED_EVENT_TYPE: {
      if (envelope.source.actor !== "customer") return undefined;

      const { purchase } =
        envelope.payload as GiftCardStudioPurchaseCreatedPayload;
      const value = purchase.amountPurchased;
      const clientIdSeed = `${envelope.organizationId}:${purchase._id}`;

      return {
        name: "purchase",
        params: withReportParams(
          {
            event_id: envelope.id,
            transaction_id: purchase._id,
            value,
            currency,
            items: [
              {
                item_id: purchase.designId,
                item_name: purchase.designName,
                price: value,
                quantity: 1,
              },
            ],
          },
          clientIdSeed,
        ),
        clientIdSeed,
      };
    }

    case "customerPackage.issued": {
      const { customerPackage } =
        envelope.payload as CustomerPackageIssuedPayload;
      if (customerPackage.channel !== "customer") return undefined;

      const value = customerPackage.price;
      const clientIdSeed = `${envelope.organizationId}:${customerPackage.customerId}`;

      return {
        name: "purchase",
        params: withReportParams(
          {
            event_id: envelope.id,
            transaction_id: customerPackage._id,
            value,
            currency,
            items: [
              {
                item_id: customerPackage.packageId,
                item_name: customerPackage.name,
                price: value,
                quantity: 1,
              },
            ],
          },
          clientIdSeed,
        ),
        clientIdSeed,
      };
    }

    case FORM_RESPONSE_CREATED_EVENT_TYPE: {
      if (!isPublicActor(envelope.source)) return undefined;

      const { formResponse, form } =
        envelope.payload as FormResponseCreatedPayload;
      const clientIdSeed = `${envelope.organizationId}:${formResponse._id}`;

      return {
        name: "generate_lead",
        params: withReportParams(
          {
            event_id: envelope.id,
            transaction_id: formResponse._id,
            lead_type: "form",
            items: [
              {
                item_id: form._id,
                item_name: form.name,
              },
            ],
          },
          clientIdSeed,
        ),
        clientIdSeed,
      };
    }

    default:
      return undefined;
  }
}
