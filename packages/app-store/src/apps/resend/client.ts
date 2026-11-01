import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ConnectedAppData,
  ConnectedAppError,
  ConnectedAppUpdateModel,
  ConnectedOauthAppTokens,
} from "@hacado/types/apps";
import { decrypt, encrypt } from "@hacado/utils/server";
import { createHash, randomBytes } from "node:crypto";
import { ResendAppData } from "./models";
import { ResendAdminAllKeys } from "./translations/types";

export const RESEND_OAUTH_AUTHORIZE_URL =
  "https://api.resend.com/oauth/authorize";

export const RESEND_OAUTH_TOKEN_URL = "https://api.resend.com/oauth/token";
export const RESEND_OAUTH_REVOKE_URL = "https://api.resend.com/oauth/revoke";
export const RESEND_OAUTH_SCOPE = "emails:send";

const CONNECTED_APPS_COLLECTION = "connected-apps";

function base64url(input: Buffer | string): string {
  const buffer = typeof input === "string" ? Buffer.from(input) : input;
  return buffer.toString("base64url");
}

export function generatePkcePair(): {
  codeVerifier: string;
  codeChallenge: string;
} {
  const codeVerifier = base64url(randomBytes(64));
  const codeChallenge = base64url(
    createHash("sha256").update(codeVerifier).digest(),
  );

  return { codeVerifier, codeChallenge };
}

export function getResendOAuthCredentials(): {
  clientId: string;
  clientSecret: string;
} {
  const clientId = process.env.RESEND_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.RESEND_OAUTH_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new ConnectedAppError(
      "app_resend_admin.statusText.missing_oauth_config" satisfies ResendAdminAllKeys,
    );
  }

  return { clientId, clientSecret };
}

export function getBasicAuthHeader(
  clientId: string,
  clientSecret: string,
): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
  scope?: string;
};

export async function exchangeAuthorizationCode(params: {
  code: string;
  redirectUri: string;
  codeVerifier: string;
  clientId: string;
  clientSecret: string;
}): Promise<ConnectedOauthAppTokens> {
  const logger = getLoggerFactory("ResendOAuth")("exchangeAuthorizationCode");
  logger.debug(
    { redirectUri: params.redirectUri },
    "POST /oauth/token (authorization_code)",
  );

  const response = await fetch(RESEND_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: getBasicAuthHeader(params.clientId, params.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: params.redirectUri,
      code_verifier: params.codeVerifier,
      client_id: params.clientId,
    }),
  });

  const body = (await response.json()) as TokenResponse;
  if (!response.ok || body.error || !body.access_token || !body.refresh_token) {
    logger.error(
      {
        status: response.status,
        error: body.error,
        errorDescription: body.error_description,
        hasAccessToken: !!body.access_token,
        hasRefreshToken: !!body.refresh_token,
      },
      "Authorization code exchange failed",
    );

    throw new ConnectedAppError(
      "app_resend_admin.statusText.oauth_error" satisfies ResendAdminAllKeys,
    );
  }

  logger.debug(
    {
      expiresIn: body.expires_in,
      scope: body.scope,
    },
    "Authorization code exchange succeeded",
  );

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresOn: new Date(
      Math.round(Date.now() + (body.expires_in ?? 900) * 1000),
    ),
  };
}

export async function refreshResendTokens(params: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<ConnectedOauthAppTokens> {
  const logger = getLoggerFactory("ResendOAuth")("refreshResendTokens");
  logger.debug("POST /oauth/token (refresh_token)");

  const response = await fetch(RESEND_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: getBasicAuthHeader(params.clientId, params.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: params.refreshToken,
      client_id: params.clientId,
    }),
  });

  const body = (await response.json()) as TokenResponse;
  if (!response.ok || body.error || !body.access_token || !body.refresh_token) {
    logger.error(
      {
        status: response.status,
        error: body.error,
        errorDescription: body.error_description,
        hasAccessToken: !!body.access_token,
        hasRefreshToken: !!body.refresh_token,
      },
      "Refresh token exchange failed",
    );

    throw new ConnectedAppError(
      "app_resend_admin.statusText.oauth_error" satisfies ResendAdminAllKeys,
    );
  }

  logger.debug(
    {
      expiresIn: body.expires_in,
      scope: body.scope,
    },
    "Refresh token exchange succeeded (refresh token rotated)",
  );

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresOn: new Date(
      Math.round(Date.now() + (body.expires_in ?? 900) * 1000),
    ),
  };
}

export async function revokeResendToken(params: {
  token: string;
  clientId: string;
  clientSecret: string;
}): Promise<void> {
  const logger = getLoggerFactory("ResendOAuth")("revokeResendToken");
  logger.debug("POST /oauth/revoke");

  const response = await fetch(RESEND_OAUTH_REVOKE_URL, {
    method: "POST",
    headers: {
      Authorization: getBasicAuthHeader(params.clientId, params.clientSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      token: params.token,
      client_id: params.clientId,
    }),
  });

  if (!response.ok) {
    let errorBody: string | undefined;
    try {
      errorBody = await response.text();
    } catch {
      errorBody = undefined;
    }

    logger.warn(
      { status: response.status, errorBody },
      "Token revoke returned non-OK status",
    );
  } else {
    logger.debug({ status: response.status }, "Token revoke succeeded");
  }
}

/** Refresh ~60s before expiry; Resend access tokens last 15 minutes. */
const REFRESH_SKEW_MS = 60_000;

export class ResendOAuthClient {
  private readonly loggerFactory: LoggerFactory;

  constructor(
    private readonly app: ConnectedAppData<
      ResendAppData,
      ConnectedOauthAppTokens
    >,
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly update: (update: ConnectedAppUpdateModel) => Promise<void>,
    loggerFactory?: LoggerFactory,
  ) {
    this.loggerFactory =
      loggerFactory ??
      getLoggerFactory("ResendOAuthClient", app.organizationId);
  }

  public async getAccessToken(): Promise<string> {
    const logger = this.loggerFactory("getAccessToken");
    const token = this.app.token;
    if (!token?.accessToken) {
      logger.error({ appId: this.app._id }, "Access token missing on app");
      throw new ConnectedAppError(
        "app_resend_admin.statusText.oauth_error" satisfies ResendAdminAllKeys,
      );
    }

    const expiresOn = token.expiresOn ? new Date(token.expiresOn).getTime() : 0;
    const msUntilExpiry = expiresOn - Date.now();
    if (expiresOn > Date.now() + REFRESH_SKEW_MS) {
      logger.debug(
        {
          appId: this.app._id,
          msUntilExpiry,
          expiresOn: token.expiresOn,
        },
        "Using existing access token",
      );

      return decrypt(token.accessToken);
    }

    logger.info(
      {
        appId: this.app._id,
        msUntilExpiry,
        expiresOn: token.expiresOn,
      },
      "Access token expired or near expiry; refreshing",
    );

    const tokens = await this.refreshToken();
    return tokens.accessToken;
  }

  private async refreshToken(): Promise<ConnectedOauthAppTokens> {
    const logger = this.loggerFactory("refreshToken");
    if (!this.app.token?.refreshToken) {
      logger.error({ appId: this.app._id }, "Refresh token not set");
      throw new ConnectedAppError(
        "app_resend_admin.statusText.refresh_token_not_set" satisfies ResendAdminAllKeys,
      );
    }

    logger.debug({ appId: this.app._id }, "Refreshing Resend OAuth tokens");
    const tokens = await refreshResendTokens({
      refreshToken: decrypt(this.app.token.refreshToken),
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });

    const encrypted = {
      accessToken: encrypt(tokens.accessToken),
      refreshToken: encrypt(tokens.refreshToken),
      expiresOn: tokens.expiresOn,
    } satisfies ConnectedOauthAppTokens;

    this.app.token = encrypted;
    await this.update({ token: encrypted });
    logger.info(
      {
        appId: this.app._id,
        expiresOn: tokens.expiresOn,
      },
      "Persisted rotated Resend OAuth tokens",
    );

    return tokens;
  }
}

export async function loadConnectedApp(
  getDbConnection: () => Promise<import("mongodb").Db>,
  appId: string,
): Promise<ConnectedAppData<ResendAppData, ConnectedOauthAppTokens> | null> {
  const db = await getDbConnection();
  return db
    .collection<
      ConnectedAppData<ResendAppData, ConnectedOauthAppTokens>
    >(CONNECTED_APPS_COLLECTION)
    .findOne({ _id: appId });
}
