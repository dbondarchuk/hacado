import type { ConnectedAppData } from "./connected-app.data";

/**
 * Optional method for apps with scope `public-event-context-provider`.
 * Extracts per-app context from a public HTTP request to attach to event sources.
 */
export interface IPublicEventContextProvider {
  getPublicEventContext(
    appData: ConnectedAppData,
    request: Request,
  ): Promise<Record<string, any> | null | undefined>;
}
