import { APP_EVENT_CONFIGS } from "@hacado/app-store/app-events";
import type { EventDefinition } from "@hacado/types";

import { DOMAIN_EVENT_DEFINITIONS } from "./definitions";

/**
 * Event definitions that are not tied to a specific app manifest (e.g. platform lifecycle).
 * Domain definitions live in `./definitions/`; app-owned types use `app-events`.
 */
export const EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  ...DOMAIN_EVENT_DEFINITIONS,
};

let initialized = false;
const definitionsByType = new Map<string, EventDefinition>();

export function resolveEventDefinition(
  eventType: string,
): EventDefinition | undefined {
  if (!initialized) {
    initialized = true;
    for (const def of Object.values(EVENT_DEFINITIONS)) {
      definitionsByType.set(def.type, def);
    }
    for (const config of Object.values(APP_EVENT_CONFIGS)) {
      if (!config.events?.length) continue;
      for (const def of config.events) {
        if (!definitionsByType.has(def.type)) {
          definitionsByType.set(def.type, def);
        }
      }
    }
  }
  return definitionsByType.get(eventType);
}
