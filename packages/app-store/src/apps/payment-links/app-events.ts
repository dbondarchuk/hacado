import type { AppEventConfig, EventDefinition } from "@hacado/types";
import { formatAmountWithCurrency, getAdminUrl } from "@hacado/utils";
import { DateTime } from "luxon";
import { buildPaymentPaidEmailNotifications } from "./emails/paid-email";
import type { PaymentLinksSettings } from "./models";
import {
  PAYMENT_LINKS_PAYMENT_PAID_EVENT_TYPE,
  type PaymentLinksPaymentPaidPayload,
} from "./models/events";
import { PaymentLinksAdminAllKeys } from "./translations/types";

const COORDINATOR_AND_ABOVE = ["owner", "admin", "coordinator"] as const;

export const PAYMENT_LINKS_APP_EVENTS: AppEventConfig = {
  events: [
    {
      type: PAYMENT_LINKS_PAYMENT_PAID_EVENT_TYPE,
      recordActivity: (envelope) => {
        const { payment } = envelope.payload as PaymentLinksPaymentPaidPayload;
        return {
          eventId: envelope.id,
          eventType: envelope.type,
          title: {
            key: "app_payment-links_admin.activity.paymentPaid.title" satisfies PaymentLinksAdminAllKeys,
          },
          description: {
            key: "app_payment-links_admin.activity.paymentPaid.description" satisfies PaymentLinksAdminAllKeys,
            args: {
              amount: payment.amount,
              customerId: payment.customerId,
            },
          },
          link: `/dashboard/financials/payments?id=${payment._id}`,
          source: envelope.source,
        };
      },
      emailNotifications: async (envelope, services) => {
        const { appId, payment } =
          envelope.payload as PaymentLinksPaymentPaidPayload;

        let app;
        try {
          app = await services.connectedAppsService.getApp(appId);
        } catch {
          return null;
        }

        const settings = (app.data ?? {}) as Partial<PaymentLinksSettings>;
        const notifyOnPaid = Boolean(settings.notifyOnPaid);
        const notifyCoordinators = Boolean(settings.notifyCoordinatorsOnPaid);

        if (!notifyOnPaid && !notifyCoordinators) {
          return null;
        }

        const recipientsById = new Map<
          string,
          {
            memberId: string;
            email: string;
            name: string;
            language?: string | null;
          }
        >();

        const addMember = async (memberId?: string) => {
          if (!memberId || recipientsById.has(memberId)) {
            return;
          }

          const member = await services.teamService.getMemberById(memberId);
          if (!member?.email || member.status !== "active") {
            return;
          }

          recipientsById.set(memberId, {
            memberId,
            email: member.email,
            name: member.name || member.email,
            language: member.language,
          });
        };

        if (notifyOnPaid) {
          await addMember(payment.createdByMemberId);

          if (payment.appointmentId) {
            const appointment = await services.bookingService.getAppointment(
              payment.appointmentId,
            );
            await addMember(appointment?.memberId);
          }
        }

        if (notifyCoordinators) {
          const coordinators =
            await services.teamService.getOrganizationMemberContacts([
              ...COORDINATOR_AND_ABOVE,
            ]);

          for (const contact of coordinators) {
            recipientsById.set(contact.memberId, contact);
          }
        }

        const recipients = [...recipientsById.values()];
        if (!recipients.length) {
          return null;
        }

        const [customer, organization, { general, brand }] = await Promise.all([
          services.customersService.getCustomer(payment.customerId),
          services.organizationService.getOrganization(),
          services.configurationService.getConfigurations("general", "brand"),
        ]);

        if (!organization) {
          return null;
        }

        const adminUrl = getAdminUrl();
        let appointmentLabel: string | undefined;
        let appointmentUrl: string | undefined;
        if (payment.appointmentId) {
          const appointment = await services.bookingService.getAppointment(
            payment.appointmentId,
          );

          if (appointment) {
            appointmentLabel = `${appointment.option?.name ?? "Appointment"} · ${DateTime.fromJSDate(
              new Date(appointment.dateTime),
            )
              .setZone(general.timeZone)
              .setLocale(brand.language)
              .toFormat("DDD t")}`;
            appointmentUrl = `${adminUrl}/dashboard/appointments/${appointment._id}`;
          }
        }

        const amountFormatted = formatAmountWithCurrency(
          payment.amount,
          brand.language,
          general.currency,
        );
        const tipFormatted =
          typeof payment.tipAmount === "number" && payment.tipAmount > 0
            ? formatAmountWithCurrency(
                payment.tipAmount,
                brand.language,
                general.currency,
              )
            : undefined;
        const paidAtFormatted = DateTime.fromJSDate(
          new Date(payment.paidAt ?? payment.updatedAt ?? Date.now()),
        )
          .setZone(general.timeZone)
          .setLocale(brand.language)
          .toFormat("DDD t");
        const organizationLabel =
          organization.name?.trim() || organization.slug || "";

        return buildPaymentPaidEmailNotifications(
          {
            payment,
            amountFormatted,
            tipFormatted,
            paidAtFormatted,
            customerName: customer?.name?.trim() || customer?.email || "-",
            customerUrl: `${adminUrl}/dashboard/customers/${payment.customerId}`,
            appointmentLabel,
            appointmentUrl,
            organizationName: organizationLabel,
          },
          recipients,
          organizationLabel ? { config: { name: organizationLabel } } : {},
        );
      },
      smsNotifications: false,
    } as EventDefinition<PaymentLinksPaymentPaidPayload>,
  ],
};
