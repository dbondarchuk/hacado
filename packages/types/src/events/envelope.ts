/** Per connected-app public request context, keyed by connected app id. */
export type PublicEventContextByApp = Record<string, Record<string, any>>;

export type EventSourceContext = {
  public?: PublicEventContextByApp;
};

export type EventSource =
  | {
      actor: "member" | "customer";
      actorId?: string;
      context?: EventSourceContext;
    }
  | {
      actor: "visitor";
      actorName: string;
      context?: EventSourceContext;
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

/**
 * Restricts {@link EventSource.context}.public to a single connected app
 * before delivering an event to that app's subscriber.
 */
export function eventSourceForAppDelivery(
  source: EventSource,
  appId: string,
): EventSource {
  if (source.actor === "system") {
    return source;
  }

  const publicByApp = source.context?.public;
  if (!publicByApp) {
    return source;
  }

  const appContext = publicByApp[appId];
  if (!appContext) {
    const { context: _context, ...rest } = source;
    return rest;
  }

  return {
    ...source,
    context: { public: { [appId]: appContext } },
  };
}

export type EventEnvelope<T = unknown> = {
  id: string;
  type: string;
  payload: T;
  organizationId: string;
  createdAt: Date;
  source: EventSource;
};

export function envelopeForAppDelivery(
  envelope: EventEnvelope,
  appId: string,
): EventEnvelope {
  return {
    ...envelope,
    source: eventSourceForAppDelivery(envelope.source, appId),
  };
}
