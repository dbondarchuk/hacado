import type { WaitlistEntry } from "./waitlist";
/** Waitlist app domain events (emitted from app-store). */

export const WAITLIST_ENTRY_CREATED_EVENT_TYPE =
  "waitlist.entry.created" as const;

export type WaitlistEntryCreatedEvent = {
  type: typeof WAITLIST_ENTRY_CREATED_EVENT_TYPE;
  payload: {
    entry: WaitlistEntry;
  };
};

export const WAITLIST_ENTRIES_DISMISSED_EVENT_TYPE =
  "waitlist.entry.dismissed" as const;

export type WaitlistEntriesDismissedEvent = {
  type: typeof WAITLIST_ENTRIES_DISMISSED_EVENT_TYPE;
  payload: {
    entries: WaitlistEntry[];
  };
};
