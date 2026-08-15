export type EventSource =
  | {
      actor: "member" | "customer";
      actorId?: string;
    }
  | {
      actor: "visitor";
      actorName: string;
    }
  | {
      actor: "system";
    };

/** Emits from jobs, install flows, and integrations without a signed-in member. */
export const systemEventSource: EventSource = { actor: "system" };

export function memberEventSource(memberId: string): EventSource {
  return { actor: "member", actorId: memberId };
}

export function customerEventSource(customerId: string): EventSource {
  return { actor: "customer", actorId: customerId };
}

export function visitorEventSource(visitorName: string): EventSource {
  return { actor: "visitor", actorName: visitorName };
}

export type EventEnvelope<T = unknown> = {
  id: string;
  type: string;
  payload: T;
  organizationId: string;
  createdAt: Date;
  source: EventSource;
};
