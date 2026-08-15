import type { Asset, AssetEntity, AssetUpdate } from "../assets";
import type { OrganizationSubscriptionStatus } from "../billing";
import type { Appointment, AppointmentStatus } from "../booking/appointment";
import type {
  AppointmentAddon,
  AppointmentAddonUpdateModel,
  AppointmentOption,
  AppointmentOptionUpdateModel,
} from "../booking/appointment-option";
import type { Discount, DiscountUpdateModel } from "../booking/discount";
import type { ServiceField, ServiceFieldUpdateModel } from "../booking/field";
import type {
  GiftCardListModel,
  GiftCardStatus,
  GiftCardUpdateModel,
} from "../booking/gift-card";
import type { Payment, PaymentUpdateModel } from "../booking/payment";
import type { SyncedPayment } from "../booking/synced-payment";
import type { ConfigurationKey } from "../configuration";
import type { Customer, CustomerUpdateModel } from "../customers/customer";
import type { Page, PageFooter, PageHeader } from "../pages";
import type { Template } from "../templates";
import type {
  MemberInactiveReason,
  OrganizationMember,
  UserRole,
} from "../users";
import {
  ADDON_CREATED_EVENT_TYPE,
  ADDON_DELETED_EVENT_TYPE,
  ADDON_UPDATED_EVENT_TYPE,
  APP_CONNECTED_EVENT_TYPE,
  APP_FAILED_EVENT_TYPE,
  APP_INSTALLED_EVENT_TYPE,
  APP_UNINSTALLED_EVENT_TYPE,
  APPOINTMENT_CREATED_EVENT_TYPE,
  APPOINTMENT_OPTION_CREATED_EVENT_TYPE,
  APPOINTMENT_OPTION_DELETED_EVENT_TYPE,
  APPOINTMENT_OPTION_UPDATED_EVENT_TYPE,
  APPOINTMENT_RESCHEDULED_EVENT_TYPE,
  APPOINTMENT_SLOT_RESCHEDULED_EVENT_TYPE,
  APPOINTMENT_STATUS_CHANGED_EVENT_TYPE,
  ASSET_CREATED_EVENT_TYPE,
  ASSET_DELETED_EVENT_TYPE,
  ASSET_UPDATED_EVENT_TYPE,
  CUSTOMER_CREATED_EVENT_TYPE,
  CUSTOMER_DELETED_EVENT_TYPE,
  CUSTOMER_UPDATED_EVENT_TYPE,
  DISCOUNT_APPLIED_EVENT_TYPE,
  DISCOUNT_CREATED_EVENT_TYPE,
  DISCOUNT_DELETED_EVENT_TYPE,
  DISCOUNT_UPDATED_EVENT_TYPE,
  FIELD_CREATED_EVENT_TYPE,
  FIELD_DELETED_EVENT_TYPE,
  FIELD_UPDATED_EVENT_TYPE,
  GIFT_CARD_CREATED_EVENT_TYPE,
  GIFT_CARD_DELETED_EVENT_TYPE,
  GIFT_CARD_STATUS_CHANGED_EVENT_TYPE,
  GIFT_CARD_UPDATED_EVENT_TYPE,
  INVITATION_CANCELED_EVENT_TYPE,
  INVITATION_CREATED_EVENT_TYPE,
  MEMBER_CREATED_EVENT_TYPE,
  MEMBER_DEACTIVATED_EVENT_TYPE,
  MEMBER_PROFILE_UPDATED_EVENT_TYPE,
  MEMBER_REACTIVATED_EVENT_TYPE,
  MEMBER_ROLE_CHANGED_EVENT_TYPE,
  ORGANIZATION_DOMAIN_CHANGED_EVENT_TYPE,
  PAGE_CREATED_EVENT_TYPE,
  PAGE_DELETED_EVENT_TYPE,
  PAGE_FOOTER_CREATED_EVENT_TYPE,
  PAGE_FOOTER_DELETED_EVENT_TYPE,
  PAGE_FOOTER_UPDATED_EVENT_TYPE,
  PAGE_HEADER_CREATED_EVENT_TYPE,
  PAGE_HEADER_DELETED_EVENT_TYPE,
  PAGE_HEADER_UPDATED_EVENT_TYPE,
  PAGE_UPDATED_EVENT_TYPE,
  PAYMENT_CREATED_EVENT_TYPE,
  PAYMENT_DELETED_EVENT_TYPE,
  PAYMENT_REFUNDED_EVENT_TYPE,
  PAYMENT_UPDATED_EVENT_TYPE,
  SETTINGS_UPDATED_EVENT_TYPE,
  SMS_CREDITS_EXHAUSTED_EVENT_TYPE,
  SMS_CREDITS_LOW_EVENT_TYPE,
  SMS_TOPUP_PURCHASED_EVENT_TYPE,
  SUBSCRIPTION_STATUS_CHANGED_EVENT_TYPE,
  SYNCED_PAYMENT_AMOUNTS_UPDATED_EVENT_TYPE,
  SYNCED_PAYMENT_ASSIGNED_EVENT_TYPE,
  SYNCED_PAYMENT_CONFIRMED_EVENT_TYPE,
  SYNCED_PAYMENT_IGNORED_EVENT_TYPE,
  SYNCED_PAYMENT_INGESTED_EVENT_TYPE,
  SYNCED_PAYMENT_REJECTED_EVENT_TYPE,
  SYNCED_PAYMENT_UNASSIGNED_EVENT_TYPE,
  SYNCED_PAYMENT_UNRECORDED_EVENT_TYPE,
  TEMPLATE_CREATED_EVENT_TYPE,
  TEMPLATE_DELETED_EVENT_TYPE,
  TEMPLATE_UPDATED_EVENT_TYPE,
} from "./core-events";

/** Emitted with {@link APPOINTMENT_CREATED_EVENT_TYPE}. */
export type AppointmentCreatedPayload = {
  appointment: Appointment;
  confirmed: boolean;
};

/** Emitted with {@link APPOINTMENT_RESCHEDULED_EVENT_TYPE} (full appointment update). */
export type AppointmentRescheduledPayload = {
  updatedAppointment: Appointment;
  dateTime: Date;
  totalDuration: number;
  previousDateTime: Date;
  previousTotalDuration: number;
  doNotNotifyCustomer?: boolean;
};

/** Emitted with {@link APPOINTMENT_SLOT_RESCHEDULED_EVENT_TYPE} (time/duration delta reschedule). */
export type AppointmentSlotRescheduledPayload = {
  appointment: Appointment;
  newTime: Date;
  newDuration: number;
  oldTime?: Date;
  oldDuration?: number;
  doNotNotifyCustomer?: boolean;
};

/** Emitted with {@link APPOINTMENT_STATUS_CHANGED_EVENT_TYPE}. */
export type AppointmentStatusChangedPayload = {
  appointment: Appointment;
  newStatus: AppointmentStatus;
  oldStatus?: AppointmentStatus;
};

/** Emitted with {@link DISCOUNT_APPLIED_EVENT_TYPE}. */
export type DiscountAppliedPayload = {
  customer: Customer;
  discount: {
    id: string;
    name: string;
    value: number;
    code?: string;
    dateTime: Date;
    appointmentId: string;
    appointmentOptionId?: string;
    appointmentAddonIds?: string[];
    appointmentTotalPrice: number;
    appointmentDateTime: Date;
  };
};

export type CustomerCreatedPayload = { customer: Customer };

export type CustomerUpdatedPayload = {
  customer: Customer;
  update: CustomerUpdateModel;
};

export type CustomerDeletedPayload = { customers: Customer[] };

export type PaymentCreatedPayload = { payment: Payment };

export type PaymentUpdatedPayload = {
  payment: Payment;
  update: Partial<PaymentUpdateModel>;
};

export type PaymentDeletedPayload = { payment: Payment };

export type PaymentRefundedPayload = { payment: Payment; amount: number };

export type SyncedPaymentIngestedPayload = { syncedPayment: SyncedPayment };

export type SyncedPaymentConfirmedPayload = { syncedPayment: SyncedPayment };

export type SyncedPaymentRejectedPayload = { syncedPayment: SyncedPayment };

export type SyncedPaymentAssignedPayload = {
  syncedPayment: SyncedPayment;
  previousAppointmentId?: string;
};

export type SyncedPaymentUnassignedPayload = {
  syncedPayment: SyncedPayment;
  previousAppointmentId?: string;
};

export type SyncedPaymentUnrecordedPayload = {
  syncedPayment: SyncedPayment;
  previousCustomerId?: string;
};

export type SyncedPaymentIgnoredPayload = { syncedPayment: SyncedPayment };

export type SyncedPaymentAmountsUpdatedPayload = {
  syncedPayment: SyncedPayment;
  previousPaymentAmount?: number;
  previousTip?: number;
};

export type GiftCardCreatedPayload = { giftCard: GiftCardListModel };

export type GiftCardUpdatedPayload = {
  giftCard: GiftCardListModel;
  previous: GiftCardUpdateModel;
};

export type GiftCardStatusChangedPayload = {
  ids: string[];
  status: GiftCardStatus;
};

export type GiftCardDeletedPayload = { giftCardIds: string[] };

export type FieldCreatedPayload = { field: ServiceField };

export type FieldUpdatedPayload = {
  field: ServiceField;
  update: Partial<ServiceFieldUpdateModel>;
};

export type FieldDeletedPayload = { fieldIds: string[] };

export type AddonCreatedPayload = { addon: AppointmentAddon };

export type AddonUpdatedPayload = {
  addon: AppointmentAddon;
  update: Partial<AppointmentAddonUpdateModel>;
};

export type AddonDeletedPayload = { addonIds: string[] };

export type AppointmentOptionCreatedPayload = { option: AppointmentOption };

export type AppointmentOptionUpdatedPayload = {
  option: AppointmentOption;
  update: Partial<AppointmentOptionUpdateModel>;
};

export type AppointmentOptionDeletedPayload = { optionIds: string[] };

export type DiscountCreatedPayload = { discount: Discount };

export type DiscountUpdatedPayload = {
  discount: Discount;
  update: Partial<DiscountUpdateModel>;
};

export type DiscountDeletedPayload = { discountIds: string[] };

export type AppInstalledPayload = {
  appId: string;
  appName: string;
};

export type AppUninstalledPayload = {
  appId: string;
  appName: string;
};

export type AppConnectedPayload = {
  appId: string;
  appName: string;
};

export type AppFailedPayload = {
  appId: string;
  appName: string;
  /** Connected-app owner member; used for failure notifications. */
  memberId: string;
};

export type OrganizationDomainChangedPayload = {
  previousDomain: string | null;
  newDomain: string | null;
};

export type TemplateCreatedPayload = { template: Template };
export type TemplateUpdatedPayload = { template: Template };
export type TemplateDeletedPayload = { templateIds: string[] };

export type PageCreatedPayload = { page: Page };
export type PageUpdatedPayload = { page: Page };
export type PageDeletedPayload = { pageIds: string[] };

export type PageHeaderCreatedPayload = { pageHeader: PageHeader };
export type PageHeaderUpdatedPayload = { pageHeader: PageHeader };
export type PageHeaderDeletedPayload = { pageHeaderIds: string[] };

export type PageFooterCreatedPayload = { pageFooter: PageFooter };
export type PageFooterUpdatedPayload = { pageFooter: PageFooter };
export type PageFooterDeletedPayload = { pageFooterIds: string[] };

export type SettingsUpdatedPayload = { key: ConfigurationKey };

export type AssetCreatedPayload = { asset: AssetEntity };
export type AssetUpdatedPayload = {
  asset: Asset;
  update: Partial<AssetUpdate>;
};
export type AssetDeletedPayload = { assetIds: string[] };

export type MemberDeactivatedPayload = {
  member: OrganizationMember;
  reason: MemberInactiveReason;
};

export type MemberReactivatedPayload = {
  member: OrganizationMember;
};

export type MemberRoleChangedPayload = {
  member: OrganizationMember;
  previousRole: UserRole;
  role: Exclude<UserRole, "owner">;
};

export type MemberProfileUpdatedPayload = {
  member: OrganizationMember;
  update: Partial<
    Pick<
      OrganizationMember,
      | "name"
      | "phone"
      | "language"
      | "image"
      | "bio"
      | "calendarSources"
      | "meetingUrlProviderAppId"
    >
  >;
};

export type MemberCreatedPayload = {
  member: OrganizationMember;
  invitationId?: string;
};

export type InvitationCreatedPayload = {
  invitationId: string;
  email: string;
  role: string;
};

export type InvitationCanceledPayload = {
  invitationId: string;
  email: string;
  role: string;
};

export type SubscriptionStatusChangedPayload = {
  oldStatus: OrganizationSubscriptionStatus | null;
  newStatus: OrganizationSubscriptionStatus;
  subscriptionId: string;
  productName: string | null;
};

export type SmsCreditsThresholdPayload = {
  balance: number;
};

export type SmsTopupPurchasedPayload = {
  /** Credits added to the org top-up pool. */
  credits: number;
};

/** Maps core platform event type strings to their payload shapes (services emits). */
export type CoreEventPayloadByType = {
  [CUSTOMER_CREATED_EVENT_TYPE]: CustomerCreatedPayload;
  [CUSTOMER_UPDATED_EVENT_TYPE]: CustomerUpdatedPayload;
  [CUSTOMER_DELETED_EVENT_TYPE]: CustomerDeletedPayload;
  [PAYMENT_CREATED_EVENT_TYPE]: PaymentCreatedPayload;
  [PAYMENT_UPDATED_EVENT_TYPE]: PaymentUpdatedPayload;
  [PAYMENT_DELETED_EVENT_TYPE]: PaymentDeletedPayload;
  [PAYMENT_REFUNDED_EVENT_TYPE]: PaymentRefundedPayload;
  [SYNCED_PAYMENT_INGESTED_EVENT_TYPE]: SyncedPaymentIngestedPayload;
  [SYNCED_PAYMENT_CONFIRMED_EVENT_TYPE]: SyncedPaymentConfirmedPayload;
  [SYNCED_PAYMENT_REJECTED_EVENT_TYPE]: SyncedPaymentRejectedPayload;
  [SYNCED_PAYMENT_ASSIGNED_EVENT_TYPE]: SyncedPaymentAssignedPayload;
  [SYNCED_PAYMENT_UNASSIGNED_EVENT_TYPE]: SyncedPaymentUnassignedPayload;
  [SYNCED_PAYMENT_UNRECORDED_EVENT_TYPE]: SyncedPaymentUnrecordedPayload;
  [SYNCED_PAYMENT_IGNORED_EVENT_TYPE]: SyncedPaymentIgnoredPayload;
  [SYNCED_PAYMENT_AMOUNTS_UPDATED_EVENT_TYPE]: SyncedPaymentAmountsUpdatedPayload;
  [GIFT_CARD_CREATED_EVENT_TYPE]: GiftCardCreatedPayload;
  [GIFT_CARD_UPDATED_EVENT_TYPE]: GiftCardUpdatedPayload;
  [GIFT_CARD_STATUS_CHANGED_EVENT_TYPE]: GiftCardStatusChangedPayload;
  [GIFT_CARD_DELETED_EVENT_TYPE]: GiftCardDeletedPayload;
  [FIELD_CREATED_EVENT_TYPE]: FieldCreatedPayload;
  [FIELD_UPDATED_EVENT_TYPE]: FieldUpdatedPayload;
  [FIELD_DELETED_EVENT_TYPE]: FieldDeletedPayload;
  [ADDON_CREATED_EVENT_TYPE]: AddonCreatedPayload;
  [ADDON_UPDATED_EVENT_TYPE]: AddonUpdatedPayload;
  [ADDON_DELETED_EVENT_TYPE]: AddonDeletedPayload;
  [APPOINTMENT_OPTION_CREATED_EVENT_TYPE]: AppointmentOptionCreatedPayload;
  [APPOINTMENT_OPTION_UPDATED_EVENT_TYPE]: AppointmentOptionUpdatedPayload;
  [APPOINTMENT_OPTION_DELETED_EVENT_TYPE]: AppointmentOptionDeletedPayload;
  [DISCOUNT_CREATED_EVENT_TYPE]: DiscountCreatedPayload;
  [DISCOUNT_UPDATED_EVENT_TYPE]: DiscountUpdatedPayload;
  [DISCOUNT_DELETED_EVENT_TYPE]: DiscountDeletedPayload;
  [DISCOUNT_APPLIED_EVENT_TYPE]: DiscountAppliedPayload;
  [APPOINTMENT_CREATED_EVENT_TYPE]: AppointmentCreatedPayload;
  [APPOINTMENT_RESCHEDULED_EVENT_TYPE]: AppointmentRescheduledPayload;
  [APPOINTMENT_SLOT_RESCHEDULED_EVENT_TYPE]: AppointmentSlotRescheduledPayload;
  [APPOINTMENT_STATUS_CHANGED_EVENT_TYPE]: AppointmentStatusChangedPayload;
  [APP_INSTALLED_EVENT_TYPE]: AppInstalledPayload;
  [APP_UNINSTALLED_EVENT_TYPE]: AppUninstalledPayload;
  [APP_CONNECTED_EVENT_TYPE]: AppConnectedPayload;
  [APP_FAILED_EVENT_TYPE]: AppFailedPayload;
  [ORGANIZATION_DOMAIN_CHANGED_EVENT_TYPE]: OrganizationDomainChangedPayload;
  [TEMPLATE_CREATED_EVENT_TYPE]: TemplateCreatedPayload;
  [TEMPLATE_UPDATED_EVENT_TYPE]: TemplateUpdatedPayload;
  [TEMPLATE_DELETED_EVENT_TYPE]: TemplateDeletedPayload;
  [PAGE_CREATED_EVENT_TYPE]: PageCreatedPayload;
  [PAGE_UPDATED_EVENT_TYPE]: PageUpdatedPayload;
  [PAGE_DELETED_EVENT_TYPE]: PageDeletedPayload;
  [PAGE_HEADER_CREATED_EVENT_TYPE]: PageHeaderCreatedPayload;
  [PAGE_HEADER_UPDATED_EVENT_TYPE]: PageHeaderUpdatedPayload;
  [PAGE_HEADER_DELETED_EVENT_TYPE]: PageHeaderDeletedPayload;
  [PAGE_FOOTER_CREATED_EVENT_TYPE]: PageFooterCreatedPayload;
  [PAGE_FOOTER_UPDATED_EVENT_TYPE]: PageFooterUpdatedPayload;
  [PAGE_FOOTER_DELETED_EVENT_TYPE]: PageFooterDeletedPayload;
  [SETTINGS_UPDATED_EVENT_TYPE]: SettingsUpdatedPayload;
  [ASSET_CREATED_EVENT_TYPE]: AssetCreatedPayload;
  [ASSET_UPDATED_EVENT_TYPE]: AssetUpdatedPayload;
  [ASSET_DELETED_EVENT_TYPE]: AssetDeletedPayload;
  [MEMBER_DEACTIVATED_EVENT_TYPE]: MemberDeactivatedPayload;
  [MEMBER_REACTIVATED_EVENT_TYPE]: MemberReactivatedPayload;
  [MEMBER_ROLE_CHANGED_EVENT_TYPE]: MemberRoleChangedPayload;
  [MEMBER_PROFILE_UPDATED_EVENT_TYPE]: MemberProfileUpdatedPayload;
  [MEMBER_CREATED_EVENT_TYPE]: MemberCreatedPayload;
  [INVITATION_CREATED_EVENT_TYPE]: InvitationCreatedPayload;
  [INVITATION_CANCELED_EVENT_TYPE]: InvitationCanceledPayload;
  [SUBSCRIPTION_STATUS_CHANGED_EVENT_TYPE]: SubscriptionStatusChangedPayload;
  [SMS_CREDITS_LOW_EVENT_TYPE]: SmsCreditsThresholdPayload;
  [SMS_CREDITS_EXHAUSTED_EVENT_TYPE]: SmsCreditsThresholdPayload;
  [SMS_TOPUP_PURCHASED_EVENT_TYPE]: SmsTopupPurchasedPayload;
};

export type CoreEventTypeString = keyof CoreEventPayloadByType;
