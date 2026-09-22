import type { PublicPageRendererProps } from "@hacado/types";
import type { ReactNode } from "react";
import { PAYMENT_LINKS_APP_NAME } from "./apps/payment-links/const";
import { PaymentLinksPublicPage } from "./apps/payment-links/public-page";

export type PublicPageRenderer = (
  props: PublicPageRendererProps,
) => ReactNode | Promise<ReactNode>;

/**
 * App → slug → React page component for public-page-provider takeovers.
 * Registered by apps that claim exact slugs (e.g. payment-links → "payment").
 */
export const PublicPageRenderers: Record<
  string,
  Record<string, PublicPageRenderer>
> = {};

PublicPageRenderers[PAYMENT_LINKS_APP_NAME] = {
  payment: (props) => <PaymentLinksPublicPage {...props} />,
};
