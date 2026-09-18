import type { ConnectedAppData } from "./connected-app.data";

/**
 * Optional methods implemented by connected apps that declare the
 * `llms-full-txt-provider` scope.
 */
export interface ILlmsFullTxtProvider {
  provideLlmsFullTxt?(
    appData: ConnectedAppData,
    ctx: { websiteUrl: string },
  ): Promise<string | undefined>;
}
