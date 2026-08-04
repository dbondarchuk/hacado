import type { App, AppScope } from "../apps/app";
import {
  ConnectedApp,
  ConnectedAppData,
  ConnectedAppUpdateModel,
} from "../apps/connected-app.data";
import type { IConnectedAppProps } from "../apps/connected-app.props";
import {
  ApiRequest,
  ApiResponse,
  IConnectedApp,
  ConnectedAppUninstallResult,
} from "../apps/connected-app.service";
import type { SessionUser } from "../users/session-user";

export interface IConnectedAppsService {
  createNewApp(name: string, memberId: string): Promise<string>;
  deleteApp(appId: string): Promise<ConnectedAppUninstallResult>;
  updateApp(appId: string, updateModel: ConnectedAppUpdateModel): Promise<void>;
  requestLoginUrl(appId: string): Promise<string>;
  processRedirect(name: string, request: ApiRequest, data?: any): Promise<void>;
  processWebhook(
    appId: string,
    request: ApiRequest,
  ): Promise<ApiResponse | undefined>;
  processStaticWebhook(
    appName: string,
    request: ApiRequest,
  ): Promise<ApiResponse | undefined>;
  processAppCall(
    appId: string,
    slug: string[],
    request: ApiRequest,
  ): Promise<ApiResponse | undefined>;
  processAppExternalCall(
    appId: string,
    slug: string[],
    request: Request,
  ): Promise<Response | undefined>;
  processRequest(
    appId: string,
    data: any,
    request: ApiRequest,
    user: SessionUser,
  ): Promise<any>;
  processStaticRequest(
    appName: string,
    data: any,
    request: ApiRequest,
    user: SessionUser,
  ): Promise<any>;
  processFormRequest(
    appId: string,
    formData: FormData,
    request: ApiRequest,
    user: SessionUser,
  ): Promise<any>;
  getAppStatus(appId: string): Promise<ConnectedApp>;
  getApps(): Promise<ConnectedApp[]>;
  getAppsByScope(...scope: AppScope[]): Promise<ConnectedApp[]>;
  getAppsByApp(...appNames: string[]): Promise<ConnectedApp[]>;
  getAppsByScopeWithData(...scope: AppScope[]): Promise<ConnectedAppData[]>;
  getAppsByType(type: App["type"]): Promise<{ id: string; name: string }[]>;
  getApp(appId: string): Promise<ConnectedAppData>;
  getAppsData(appIds: string[]): Promise<ConnectedAppData[]>;
  getAppService<T>(
    appId: string,
  ): Promise<{ service: IConnectedApp & T; app: ConnectedAppData }>;
  getAppServiceProps(appId: string): IConnectedAppProps;

  invokeAppsByScope<T, TReturn = void>(
    scope: AppScope,
    callback: (app: ConnectedAppData, service: T) => Promise<TReturn>,
    options?: {
      concurrencyLimit?: number;
      ignoreErrors?: boolean;
    },
  ): Promise<(TReturn | undefined)[]>;
}
