import type { EventDefinition } from "@hacado/types";

import { APP_EVENT_DEFINITIONS } from "./app/app-event-definitions";
import { ADDON_EVENT_DEFINITIONS } from "./addon/addon-event-definitions";
import { APPOINTMENT_EVENT_DEFINITIONS } from "./appointment/appointment-event-definitions";
import { APPOINTMENT_OPTION_EVENT_DEFINITIONS } from "./appointment-option/appointment-option-event-definitions";
import { ASSET_EVENT_DEFINITIONS } from "./asset/asset-event-definitions";
import { BILLING_EVENT_DEFINITIONS } from "./billing/billing-event-definitions";
import { CUSTOMER_EVENT_DEFINITIONS } from "./customer/customer-event-definitions";
import { DISCOUNT_EVENT_DEFINITIONS } from "./discount/discount-event-definitions";
import { FIELD_EVENT_DEFINITIONS } from "./field/field-event-definitions";
import { GIFT_CARD_EVENT_DEFINITIONS } from "./gift-card/gift-card-event-definitions";
import { ORGANIZATION_EVENT_DEFINITIONS } from "./organization/organization-event-definitions";
import { PAGE_EVENT_DEFINITIONS } from "./page/page-event-definitions";
import { PAGE_FOOTER_EVENT_DEFINITIONS } from "./page/page-footer-event-definitions";
import { PAGE_HEADER_EVENT_DEFINITIONS } from "./page/page-header-event-definitions";
import { PAYMENT_EVENT_DEFINITIONS } from "./payment/payment-event-definitions";
import { SETTINGS_EVENT_DEFINITIONS } from "./settings/settings-event-definitions";
import { SUBSCRIPTION_EVENT_DEFINITIONS } from "./subscription/subscription-event-definitions";
import { SYNCED_PAYMENT_EVENT_DEFINITIONS } from "./synced-payment/synced-payment-event-definitions";
import { TEMPLATE_EVENT_DEFINITIONS } from "./template/template-event-definitions";

/** Core platform event definitions, grouped by domain under `definitions/` */
export const DOMAIN_EVENT_DEFINITIONS: Record<string, EventDefinition> = {
  ...APP_EVENT_DEFINITIONS,
  ...APPOINTMENT_EVENT_DEFINITIONS,
  ...CUSTOMER_EVENT_DEFINITIONS,
  ...PAYMENT_EVENT_DEFINITIONS,
  ...SYNCED_PAYMENT_EVENT_DEFINITIONS,
  ...GIFT_CARD_EVENT_DEFINITIONS,
  ...ORGANIZATION_EVENT_DEFINITIONS,
  ...FIELD_EVENT_DEFINITIONS,
  ...ADDON_EVENT_DEFINITIONS,
  ...APPOINTMENT_OPTION_EVENT_DEFINITIONS,
  ...DISCOUNT_EVENT_DEFINITIONS,
  ...BILLING_EVENT_DEFINITIONS,
  ...SUBSCRIPTION_EVENT_DEFINITIONS,
  ...TEMPLATE_EVENT_DEFINITIONS,
  ...PAGE_EVENT_DEFINITIONS,
  ...PAGE_HEADER_EVENT_DEFINITIONS,
  ...PAGE_FOOTER_EVENT_DEFINITIONS,
  ...SETTINGS_EVENT_DEFINITIONS,
  ...ASSET_EVENT_DEFINITIONS,
};
