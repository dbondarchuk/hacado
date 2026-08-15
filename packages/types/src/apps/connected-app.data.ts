import { AllKeys, I18nNamespaces } from "@hacado/i18n";
import { WithDatabaseId, WithOrganizationId } from "../database";
import { Prettify } from "../utils";
export type ConnectedAppStatus = "pending" | "connected" | "failed";

export type ConnectedAppResponse<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> = {
  appId: string;
} & (
  | {
      data?: any;
      token?: any;
      account: ConnectedAppAccount;
    }
  | {
      error: AllKeys<T, CustomKeys>;
      errorArgs?: Record<string, any>;
    }
);

export type ConnectedOauthAppTokens = {
  accessToken: string;
  refreshToken: string;
  expiresOn: Date | undefined | null;
};

export type ConnectedAppAccount = Prettify<
  (
    | {
        username: string;
      }
    | {
        username?: string;
        serverUrl: string;
      }
    | {
        targetAppName: string;
        targetAppId: string;
      }
  ) & {
    additional?: string;
  }
>;

export class ConnectedAppError<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> extends Error {
  constructor(
    public readonly key: AllKeys<T, CustomKeys>,
    public readonly args?: Record<string, any>,
    message?: string,
  ) {
    super(message || key);
  }
}

export type ConnectedAppStatusWithText<
  T extends I18nNamespaces = I18nNamespaces,
  CustomKeys extends string | undefined = undefined,
> = {
  status: ConnectedAppStatus;
  statusText:
    | AllKeys<T, CustomKeys>
    | {
        key: AllKeys<T, CustomKeys>;
        args?: Record<string, any>;
      };
};

export type ConnectedAppData<TData = any, TToken = any> = Prettify<
  WithOrganizationId<
    WithDatabaseId<
      ConnectedAppStatusWithText & {
        name: string;
        account?: ConnectedAppAccount;
        token?: TToken;
        data?: TData;
        /** Member who installed / owns this connected app. */
        memberId: string;
      }
    >
  >
>;

export type ConnectedAppUpdateModel = Partial<
  Omit<ConnectedAppData, "_id" | "name">
>;

export type ConnectedApp = Omit<ConnectedAppData, "data" | "token">;
