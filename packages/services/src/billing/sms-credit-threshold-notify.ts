import {
  SMS_CREDITS_EXHAUSTED_EVENT_TYPE,
  SMS_CREDITS_LOW_EVENT_TYPE,
  systemEventSource,
  type IEventService,
} from "@hacado/types";

export function resolveSmsCreditThresholdKind(
  previousBalance: number,
  newBalance: number,
): "at10" | "exhausted" | null {
  if (newBalance === 0 && previousBalance > 0) {
    return "exhausted";
  }
  if (newBalance === 10 && previousBalance > 10) {
    return "at10";
  }
  return null;
}

export async function maybeEmitSmsCreditThresholdEvent(input: {
  eventService: IEventService;
  previousBalance: number;
  newBalance: number;
}): Promise<void> {
  const { eventService, previousBalance, newBalance } = input;

  const kind = resolveSmsCreditThresholdKind(previousBalance, newBalance);
  if (!kind) return;

  await eventService.emit(
    kind === "exhausted"
      ? SMS_CREDITS_EXHAUSTED_EVENT_TYPE
      : SMS_CREDITS_LOW_EVENT_TYPE,
    { balance: newBalance },
    systemEventSource,
  );
}
