import { getAdminUrl } from "@hacado/utils/website";

export const stripeConnectAuthorizeBase =
  "https://connect.stripe.com/oauth/authorize";
export const stripeConnectTokenUrl = "https://connect.stripe.com/oauth/token";

export function getStripeOAuthRedirectUri(): string {
  return `${getAdminUrl()}/apps/oauth/stripe/redirect`;
}
