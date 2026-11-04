import { ConnectedAppData } from "../connected-app.data";

/** Key-value pairs for template demo arguments (e.g. { waitlistEntry: {...} }) */
export type DemoArguments = Record<string, unknown>;

/**
 * App service interface for providing demo arguments used in template previews
 * (e.g. email templates with placeholders like waitlistEntry).
 * Apps declare scope "demo-arguments-provider"; the service implements this interface.
 */
export interface IDemoArgumentsProvider {
  getDemoArguments?(appData: ConnectedAppData): Promise<DemoArguments>;
}
