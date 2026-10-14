import type { PublicPageRendererProps } from "@hacado/types";
import type { ReactNode } from "react";
import { MY_CABINET_APP_NAME } from "./apps/my-cabinet/const";
import { MyCabinetPublicPage } from "./apps/my-cabinet/public-page";
import { PAYMENT_LINKS_APP_NAME } from "./apps/payment-links/const";
import { PaymentLinksPublicPage } from "./apps/payment-links/public-page";

export type PublicPageRenderer = (
  props: PublicPageRendererProps,
) => ReactNode | Promise<ReactNode>;

/**
 * App → slug → React page component for public-page-provider takeovers.
 * Registered by apps that claim exact slugs (e.g. payment-links → "payment").
 * Renderers may be async server components; strip `appService` before any
 * client-component boundary.
 */
export const PublicPageRenderers: Record<
  string,
  Record<string, PublicPageRenderer>
> = {};

PublicPageRenderers[PAYMENT_LINKS_APP_NAME] = {
  payment: ({ appService: _appService, ...props }) => (
    <PaymentLinksPublicPage {...props} />
  ),
};

PublicPageRenderers[MY_CABINET_APP_NAME] = {
  "my-cabinet": (props) => <MyCabinetPublicPage {...props} />,
};
