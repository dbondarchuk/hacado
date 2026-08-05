/** Core platform event type strings (emitted from @hacado/services). Payload shape is per event. */

export const CUSTOMER_CREATED_EVENT_TYPE = "customer.created" as const;
export const CUSTOMER_UPDATED_EVENT_TYPE = "customer.updated" as const;
export const CUSTOMER_DELETED_EVENT_TYPE = "customer.deleted" as const;

export const PAYMENT_CREATED_EVENT_TYPE = "payment.created" as const;
export const PAYMENT_UPDATED_EVENT_TYPE = "payment.updated" as const;
export const PAYMENT_DELETED_EVENT_TYPE = "payment.deleted" as const;
export const PAYMENT_REFUNDED_EVENT_TYPE = "payment.refunded" as const;

export const SYNCED_PAYMENT_INGESTED_EVENT_TYPE =
  "syncedPayment.ingested" as const;
export const SYNCED_PAYMENT_CONFIRMED_EVENT_TYPE =
  "syncedPayment.confirmed" as const;
export const SYNCED_PAYMENT_REJECTED_EVENT_TYPE =
  "syncedPayment.rejected" as const;
export const SYNCED_PAYMENT_ASSIGNED_EVENT_TYPE =
  "syncedPayment.assigned" as const;
export const SYNCED_PAYMENT_IGNORED_EVENT_TYPE =
  "syncedPayment.ignored" as const;
export const SYNCED_PAYMENT_AMOUNTS_UPDATED_EVENT_TYPE =
  "syncedPayment.amountsUpdated" as const;

export const GIFT_CARD_CREATED_EVENT_TYPE = "giftCard.created" as const;
export const GIFT_CARD_UPDATED_EVENT_TYPE = "giftCard.updated" as const;
export const GIFT_CARD_STATUS_CHANGED_EVENT_TYPE =
  "giftCard.statusChanged" as const;
export const GIFT_CARD_DELETED_EVENT_TYPE = "giftCard.deleted" as const;

export const FIELD_CREATED_EVENT_TYPE = "field.created" as const;
export const FIELD_UPDATED_EVENT_TYPE = "field.updated" as const;
export const FIELD_DELETED_EVENT_TYPE = "field.deleted" as const;

export const ADDON_CREATED_EVENT_TYPE = "addon.created" as const;
export const ADDON_UPDATED_EVENT_TYPE = "addon.updated" as const;
export const ADDON_DELETED_EVENT_TYPE = "addon.deleted" as const;

export const APPOINTMENT_OPTION_CREATED_EVENT_TYPE =
  "appointmentOption.created" as const;
export const APPOINTMENT_OPTION_UPDATED_EVENT_TYPE =
  "appointmentOption.updated" as const;
export const APPOINTMENT_OPTION_DELETED_EVENT_TYPE =
  "appointmentOption.deleted" as const;

export const DISCOUNT_CREATED_EVENT_TYPE = "discount.created" as const;
export const DISCOUNT_UPDATED_EVENT_TYPE = "discount.updated" as const;
export const DISCOUNT_DELETED_EVENT_TYPE = "discount.deleted" as const;
export const DISCOUNT_APPLIED_EVENT_TYPE = "discount.applied" as const;

export const APPOINTMENT_CREATED_EVENT_TYPE = "appointment.created" as const;
/** Reschedule with full appointment + slot fields (see booking service). */
export const APPOINTMENT_RESCHEDULED_EVENT_TYPE =
  "appointment.rescheduled" as const;
/** Reschedule by time/duration deltas (see booking service). */
export const APPOINTMENT_SLOT_RESCHEDULED_EVENT_TYPE =
  "appointment.slotRescheduled" as const;
export const APPOINTMENT_STATUS_CHANGED_EVENT_TYPE =
  "appointment.statusChanged" as const;

export const APP_INSTALLED_EVENT_TYPE = "app.installed" as const;
export const APP_UNINSTALLED_EVENT_TYPE = "app.uninstalled" as const;
export const APP_CONNECTED_EVENT_TYPE = "app.connected" as const;
export const APP_FAILED_EVENT_TYPE = "app.failed" as const;
export const ORGANIZATION_DOMAIN_CHANGED_EVENT_TYPE =
  "organization.domainChanged" as const;

export const TEMPLATE_CREATED_EVENT_TYPE = "template.created" as const;
export const TEMPLATE_UPDATED_EVENT_TYPE = "template.updated" as const;
export const TEMPLATE_DELETED_EVENT_TYPE = "template.deleted" as const;

export const PAGE_CREATED_EVENT_TYPE = "page.created" as const;
export const PAGE_UPDATED_EVENT_TYPE = "page.updated" as const;
export const PAGE_DELETED_EVENT_TYPE = "page.deleted" as const;

export const PAGE_HEADER_CREATED_EVENT_TYPE = "pageHeader.created" as const;
export const PAGE_HEADER_UPDATED_EVENT_TYPE = "pageHeader.updated" as const;
export const PAGE_HEADER_DELETED_EVENT_TYPE = "pageHeader.deleted" as const;

export const PAGE_FOOTER_CREATED_EVENT_TYPE = "pageFooter.created" as const;
export const PAGE_FOOTER_UPDATED_EVENT_TYPE = "pageFooter.updated" as const;
export const PAGE_FOOTER_DELETED_EVENT_TYPE = "pageFooter.deleted" as const;

export const SETTINGS_UPDATED_EVENT_TYPE = "settings.updated" as const;

export const ASSET_CREATED_EVENT_TYPE = "asset.created" as const;
export const ASSET_UPDATED_EVENT_TYPE = "asset.updated" as const;
export const ASSET_DELETED_EVENT_TYPE = "asset.deleted" as const;

/** Polar / billing subscription status changed (persisted to organization). */
export const SUBSCRIPTION_STATUS_CHANGED_EVENT_TYPE =
  "subscription.statusChanged" as const;

/** SMS credits reached low threshold (10). */
export const SMS_CREDITS_LOW_EVENT_TYPE = "billing.smsCreditsLow" as const;
/** SMS credits exhausted (0). */
export const SMS_CREDITS_EXHAUSTED_EVENT_TYPE =
  "billing.smsCreditsExhausted" as const;
/** One-time SMS top-up credits added (Polar one-time `meter_credit` product). */
export const SMS_TOPUP_PURCHASED_EVENT_TYPE =
  "billing.smsTopupPurchased" as const;
