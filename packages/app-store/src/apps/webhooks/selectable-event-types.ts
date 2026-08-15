import type { IConnectedAppProps } from "@hacado/types";
import { ALL_CORE_EVENT_TYPES } from "@hacado/types";

import { APP_EVENT_CONFIGS } from "../../app-events/registry";

/**
 * Core platform event types plus app-specific types only for apps installed on this organization.
 * Used from {@link WebhooksConnectedApp.processStaticRequest} (server only).
 */
export async function getWebhookSelectableEventTypes(
  props: Pick<IConnectedAppProps, "services">,
): Promise<string[]> {
  const apps = await props.services.connectedAppsService.getApps();
  const installedNames = new Set(apps.map((a) => a.name));

  const set = new Set<string>([...ALL_CORE_EVENT_TYPES]);
  for (const [appName, config] of Object.entries(APP_EVENT_CONFIGS)) {
    if (!installedNames.has(appName)) continue;
    for (const def of config.events ?? []) {
      set.add(def.type);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
