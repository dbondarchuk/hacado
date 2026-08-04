import { AllKeys } from "@timelish/i18n";
import type { SessionUser } from "../users/session-user";
import { ConnectedAppData, ConnectedAppResponse } from "./connected-app.data";
import { IConnectedAppProps } from "./connected-app.props";

export interface ApiRequest extends Request {
  // query: Partial<{
  //   [key: string]: string | string[];
  // }>;
  // cookies: Partial<{
  //   [key: string]: string;
  // }>;
  // body: any;
}

export interface ApiResponse extends Response {}

export type ConnectedAppUninstallResult = {
  success: boolean;
  code: string;
  error?:
    | string
    | {
        key: AllKeys;
        args?: Record<string, any>;
      };
};
// type Send<T> = (body: T) => void;
// export interface ApiResponse<Data = any> {
//   send: Send<Data>;
//   json: Send<Data>;
//   status: (statusCode: number) => ApiResponse<Data>;
//   redirect(url: string): ApiResponse<Data>;
//   redirect(status: number, url: string): ApiResponse<Data>;
// }

export interface IConnectedApp<TData = any, TToken = any> {
  processAppData?: (
    appData: NonNullable<ConnectedAppData<TData, TToken>["data"]>,
  ) => Promise<NonNullable<ConnectedAppData<TData, TToken>["data"]>>;
  processRequest?: (
    appData: ConnectedAppData<TData, TToken>,
    data: any,
    request?: ApiRequest,
    user?: SessionUser,
  ) => Promise<any>;
  processStaticRequest?: (
    data: any,
    request?: ApiRequest,
    user?: SessionUser,
  ) => Promise<any>;
  processFormRequest?: (
    appData: ConnectedAppData<TData, TToken>,
    formData: FormData,
    request?: ApiRequest,
    user?: SessionUser,
  ) => Promise<any>;
  install?: (appData: ConnectedAppData<TData, TToken>) => Promise<void>;
  unInstall?: (
    appData: ConnectedAppData<TData, TToken>,
  ) => Promise<ConnectedAppUninstallResult>;
  processAppCall?: (
    appData: ConnectedAppData<TData, TToken>,
    slug: string[],
    request: ApiRequest,
  ) => Promise<ApiResponse | undefined>;
  processAppExternalCall?: (
    appData: ConnectedAppData<TData, TToken>,
    slug: string[],
    request: Request,
  ) => Promise<Response | undefined>;
}

export interface IConnectedAppWithWebhook<TData = any, TToken = any>
  extends IConnectedApp<TData, TToken> {
  processWebhook?: (
    appData: ConnectedAppData<TData, TToken>,
    request: ApiRequest,
  ) => Promise<ApiResponse>;
  processStaticWebhook?: (
    request: ApiRequest,
    getOrganizationServiceContainer: (
      organizationId: string,
    ) => IConnectedAppProps,
  ) => Promise<ApiResponse>;
}

export interface IOAuthConnectedApp<TData = any, TToken = any>
  extends IConnectedApp<TData, TToken> {
  getLoginUrl: (appId: string) => Promise<string>;
  processRedirect: (
    request: ApiRequest,
    data?: any,
  ) => Promise<ConnectedAppResponse>;
  /**
   * Called after OAuth redirect succeeded and the connected app document was saved.
   * Use for vendor-side setup (e.g. webhooks) that needs the persisted app id and tokens.
   */
  afterOAuthConnected?: (
    appData: ConnectedAppData<TData, TToken>,
  ) => Promise<void>;
}
