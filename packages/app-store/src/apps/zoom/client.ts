import {
  ConnectedAppData,
  ConnectedAppError,
  ConnectedAppUpdateModel,
  ConnectedOauthAppTokens,
} from "@hacado/types";
import { decrypt, encrypt } from "@hacado/utils";
import { ZoomAdminAllKeys } from "./translations/types";

export const ZOOM_OAUTH_TOKEN_URL = "https://zoom.us/oauth/token";
export const ZOOM_OAUTH_AUTHORIZATION_URL = "https://zoom.us/oauth/authorize";
export const ZOOM_API_BASE_URL = "https://api.zoom.us/v2";

export class ZoomApiClient {
  constructor(
    private readonly app: ConnectedAppData,
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly update: (update: ConnectedAppUpdateModel) => Promise<void>,
  ) {}

  public async fetch(
    endpoint: string,
    options?: RequestInit,
    retry = true,
  ): Promise<Response> {
    const accessToken = await this.getAccessToken();
    const response = await fetch(`${ZOOM_API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...options?.headers,
      },
    });

    if (response.status === 401) {
      if (!retry) {
        throw new ConnectedAppError(
          "app_zoom_admin.statusText.oauth_error" satisfies ZoomAdminAllKeys,
        );
      }

      await this.refreshToken();
      return await this.fetch(endpoint, options, false);
    }

    return response;
  }

  private async getAccessToken(): Promise<string> {
    if (
      this.app.token.accessToken &&
      this.app.token.expiresOn &&
      this.app.token.expiresOn > Date.now()
    ) {
      return decrypt(this.app.token.accessToken);
    }

    const tokens = await this.refreshToken();
    return tokens.accessToken;
  }

  private async refreshToken(): Promise<ConnectedOauthAppTokens> {
    if (!this.app.token.refreshToken) {
      throw new ConnectedAppError(
        "app_zoom_admin.statusText.refresh_token_not_set" satisfies ZoomAdminAllKeys,
      );
    }

    const refreshToken = decrypt(this.app.token.refreshToken);

    const authHeader = `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64")}`;
    const response = await fetch(ZOOM_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (response.status !== 200) {
      throw new ConnectedAppError(
        "app_zoom_admin.statusText.oauth_error" satisfies ZoomAdminAllKeys,
      );
    }

    const data = await response.json();

    const tokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresOn: new Date(Date.now() + data.expires_in * 1000),
    };

    if (!tokens.accessToken || !tokens.refreshToken) {
      throw new ConnectedAppError(
        "app_zoom_admin.statusText.oauth_error" satisfies ZoomAdminAllKeys,
      );
    }

    await this.update({
      token: {
        ...this.app.token,
        ...tokens,
        accessToken: encrypt(tokens.accessToken),
        refreshToken: encrypt(tokens.refreshToken),
      },
    });

    return tokens;
  }
}
