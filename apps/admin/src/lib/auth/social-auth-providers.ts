export type SocialAuthProvider = "google" | "microsoft" | "zoom";

const SOCIAL_AUTH_PROVIDER_ENV: Record<
  SocialAuthProvider,
  { clientId: string; clientSecret: string }
> = {
  google: {
    clientId: "GOOGLE_AUTH_CLIENT_ID",
    clientSecret: "GOOGLE_AUTH_CLIENT_SECRET",
  },
  microsoft: {
    clientId: "MICROSOFT_AUTH_CLIENT_ID",
    clientSecret: "MICROSOFT_AUTH_CLIENT_SECRET",
  },
  zoom: {
    clientId: "ZOOM_AUTH_CLIENT_ID",
    clientSecret: "ZOOM_AUTH_CLIENT_SECRET",
  },
};

export function isSocialAuthProviderEnabled(
  provider: SocialAuthProvider,
): boolean {
  const env = SOCIAL_AUTH_PROVIDER_ENV[provider];
  return Boolean(process.env[env.clientId] && process.env[env.clientSecret]);
}

export function getEnabledSocialAuthProviders(): SocialAuthProvider[] {
  return (Object.keys(SOCIAL_AUTH_PROVIDER_ENV) as SocialAuthProvider[]).filter(
    isSocialAuthProviderEnabled,
  );
}

export function isSocialAuthEnabled(): boolean {
  return getEnabledSocialAuthProviders().length > 0;
}

export function isSocialAuthProvider(
  value: string,
): value is SocialAuthProvider {
  return value === "google" || value === "microsoft" || value === "zoom";
}
