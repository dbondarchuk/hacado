import { resolveLanguageFromMap, type Language } from "@hacado/i18n";

import { AssetEntity } from "@hacado/types/assets";
import {
  Appointment,
  AppointmentStatus,
  getPaymentServiceAmount,
  isAppointmentCoveredByPackage,
  isSettledPayment,
  Payment,
} from "@hacado/types/booking";
import { BookingConfiguration } from "@hacado/types/configuration/booking";
import { BrandConfiguration } from "@hacado/types/configuration/brand";
import { GeneralConfiguration } from "@hacado/types/configuration/general";
import {
  SocialConfiguration,
  SocialLinkType,
  socialType,
} from "@hacado/types/configuration/social";
import { Customer } from "@hacado/types/customers";
import { OrganizationMember } from "@hacado/types/users";
import { Country, Currency } from "@hacado/types/utils";
import { formatArguments, FormattedArguments } from "./format-arguments";
import { capitalize } from "./string";
import { durationToTime } from "./time";

const AppointmentStatusTexts: Record<
  AppointmentStatus,
  Partial<Record<Language, string>>
> = {
  pending: {
    en: "Pending",
    fr: "En attente",
    es: "Pendiente",
    uk: "Очікуєт підтвердження",
  },
  confirmed: {
    en: "Confirmed",
    fr: "Confirmé",
    es: "Confirmada",
    uk: "Підтверджено",
  },
  declined: {
    en: "Declined",
    fr: "Refusé",
    es: "Rechazada",
    uk: "Відхилено",
  },
  canceled: {
    en: "Canceled",
    fr: "Annulé",
    es: "Cancelada",
    uk: "Скасовано",
  },
  noShow: {
    en: "No-show",
    fr: "Absence",
    es: "No se presentó",
    uk: "Неявка",
  },
};

type Props<
  TAppointment extends Appointment | null | undefined,
  T extends Record<string | number, any> | undefined,
> = {
  appointment?: TAppointment;
  customer?: Customer | null;
  user?: OrganizationMember;
  config: {
    booking: BookingConfiguration;
    general: GeneralConfiguration;
    brand: BrandConfiguration;
    social: SocialConfiguration;
  };
  adminUrl: string;
  websiteUrl: string;
  locale?: Language;
  currency?: Currency;
  country?: Country;
  useAppointmentTimezone?: boolean;
  additionalProperties?: T;
  member?: OrganizationMember;
};

type ArgsProps = {
  images: (AssetEntity & { cid: string })[];
  statusText?: string;
  confirmed: boolean;
  declined: boolean;
  canceled: boolean;
  noShow: boolean;
  pending: boolean;
  totalAmountPaid?: number;
  totalAmountLeft?: number;
  totalAmountRefunded?: number;
  totalAmountLeftToPay?: number;
  subTotalAmount?: number;
  payments?: (Payment & {
    amountLeft: number;
    totalRefunded: number;
    isOnline: boolean;
    isCash: boolean;
    isInPersonCard: boolean;
    isGiftCard: boolean;
    isTips: boolean;
    isOther: boolean;
    isDeposit: boolean;
    isRescheduleFee: boolean;
    isCancellationFee: boolean;
    isPayment: boolean;
  })[];
  files: AssetEntity[];
  restFields: {
    name: string;
    value: any;
    label: string;
  }[];
  duration?: {
    hours: number;
    minutes: number;
  };
  config: GeneralConfiguration & BrandConfiguration;
  socials: {
    type: SocialLinkType;
    url: string;
  }[];
  locale: Language;
  currency: Currency;
  websiteUrl: string;
  adminUrl: string;
  user?: OrganizationMember;
  packageUsage?: {
    customerPackageId: string;
    name: string;
    itemId: string;
    credits: number;
    restored?: boolean;
    isPackageAppointment: boolean;
  };
};

type BaseArgs<TAppointment extends Appointment | null | undefined> =
  TAppointment extends Appointment
    ? ArgsProps & Appointment
    : ArgsProps & Partial<Appointment>;

export type Args<
  TAppointment extends Appointment | null | undefined,
  TAdditional extends Record<string | number, any> | undefined,
> = FormattedArguments<
  TAdditional extends undefined
    ? BaseArgs<TAppointment>
    : BaseArgs<TAppointment> & TAdditional
>;

export const getArguments = <
  TAppointment extends Appointment | null | undefined,
  TAdditional extends Record<string | number, any> | undefined,
>({
  appointment,
  customer,
  config,
  locale = config.brand.language,
  currency = config.general.currency,
  country = config.general.country,
  useAppointmentTimezone = false,
  additionalProperties,
  adminUrl,
  websiteUrl,
  user,
  member,
}: Props<TAppointment, TAdditional>): FormattedArguments<
  Args<TAppointment, TAdditional>
> => {
  const { name, email, phone, ...restFields } = appointment?.fields || {};

  const payments = appointment?.payments?.map((payment) => {
    const totalRefunded =
      payment.refunds?.reduce((acc, refund) => acc + refund.amount, 0) || 0;

    const serviceAmount = getPaymentServiceAmount(payment);
    const amountLeft = isSettledPayment(payment)
      ? Math.max(0, serviceAmount - totalRefunded)
      : 0;

    return {
      ...payment,
      appName:
        "appName" in payment && payment.appName
          ? capitalize(payment.appName)
          : (undefined as any as string),
      amountLeft,
      totalRefunded,
      isOnline: payment.method === "online",
      isCash: payment.method === "cash",
      isInPersonCard: payment.method === "in-person-card",
      isGiftCard: payment.method === "gift-card",
      isTips: payment.type === "tips" || (payment.tipAmount ?? 0) > 0,
      isOther: payment.type === "other",
      isDeposit: payment.type === "deposit",
      isRescheduleFee: payment.type === "rescheduleFee",
      isCancellationFee: payment.type === "cancellationFee",
      isPayment: payment.type === "payment",
    };
  });

  const settledPayments = payments?.filter(isSettledPayment);

  const totalAmountPaid = settledPayments?.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  const totalRefunded = settledPayments?.reduce(
    (sum, payment) => sum + payment.totalRefunded,
    0,
  );

  const totalAmountLeft = settledPayments?.reduce(
    (sum, payment) => sum + payment.amountLeft,
    0,
  );

  const totalAmountLeftToPay = appointment?.totalPrice
    ? Math.max(
        0,
        appointment.totalPrice -
          (settledPayments
            ?.filter(
              (payment) =>
                payment.type !== "rescheduleFee" &&
                payment.type !== "cancellationFee" &&
                payment.type !== "tips",
            )
            .reduce((sum, payment) => sum + payment.amountLeft, 0) || 0),
      )
    : undefined;

  const subTotal =
    appointment?.totalPrice || appointment?.discount?.discountAmount
      ? (appointment.totalPrice || 0) +
        (appointment.discount?.discountAmount || 0)
      : undefined;

  const extendedArgs: ArgsProps = {
    user,
    payments: payments || [],
    totalAmountLeft,
    totalAmountRefunded: totalRefunded,
    totalAmountPaid,
    totalAmountLeftToPay,
    subTotalAmount: subTotal,
    restFields: Object.entries(restFields).map(([name, value]) => ({
      name,
      value,
      label: appointment?.fieldsLabels?.[name] || name,
    })),
    files:
      appointment?.files?.filter(
        (file) => !file.mimeType.startsWith("image/"),
      ) || [],
    images:
      appointment?.files
        ?.filter((file) => file.mimeType.startsWith("image/"))
        .map((file) => ({
          ...file,
          cid: file._id,
        })) || [],
    statusText: appointment?.status
      ? resolveLanguageFromMap(
          AppointmentStatusTexts[appointment.status],
          locale ?? "en",
        ) || AppointmentStatusTexts[appointment.status].en
      : undefined,
    confirmed: appointment?.status === "confirmed",
    declined: appointment?.status === "declined",
    canceled: appointment?.status === "canceled",
    noShow: appointment?.status === "noShow",
    pending: appointment?.status === "pending",
    duration: appointment
      ? durationToTime(appointment.totalDuration)
      : undefined,
    config: {
      ...config.general,
      ...config.brand,
    },
    adminUrl,
    websiteUrl,
    socials:
      config.social?.links?.map((link) =>
        Object.keys(socialType).reduce(
          (acc, cur) => ({
            ...acc,
            [`is_${cur}`]: link.type === cur,
          }),
          { ...link },
        ),
      ) || [],
    locale,
    currency,
    packageUsage: appointment?.packageUsage
      ? {
          ...appointment.packageUsage,
          isPackageAppointment: isAppointmentCoveredByPackage(appointment),
        }
      : undefined,
  };

  const baseArgs: BaseArgs<TAppointment> = {
    ...((appointment || {}) as TAppointment),
    ...extendedArgs,
    customer: customer || appointment?.customer,
    totalPrice:
      appointment?.totalPrice || appointment?.discount?.discountAmount
        ? appointment.totalPrice || 0
        : undefined,
    member: member || appointment?.member,
  };

  const args = formatArguments(
    {
      ...baseArgs,
      ...(additionalProperties || {}),
    },
    locale,
    currency,
    country,
    useAppointmentTimezone ? appointment?.timeZone : config.general.timeZone,
  ) as FormattedArguments<
    TAdditional extends undefined
      ? BaseArgs<TAppointment>
      : BaseArgs<TAppointment> & TAdditional
  >;

  return args;
};
