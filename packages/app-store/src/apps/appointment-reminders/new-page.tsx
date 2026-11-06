"use client";

import { useI18n } from "@hacado/i18n/client";
import { AutoSkeleton } from "@hacado/ui/auto-skeleton";
import { toast } from "@hacado/ui/sonner";
import { useSearchParams } from "next/navigation";
import React from "react";
import { getAppointmentReminder } from "./actions";
import { AppointmentReminderForm } from "./form";
import { AppointmentReminderUpdateModel } from "./models";
import {
  AppointmentRemindersAdminKeys,
  AppointmentRemindersAdminNamespace,
  appointmentRemindersAdminNamespace,
} from "./translations/types";

export const NewAppointmentReminderPage: React.FC<{ appId: string }> = ({
  appId,
}) => {
  const searchParams = useSearchParams();
  const fromId = searchParams.get("from") as string;
  const t = useI18n<
    AppointmentRemindersAdminNamespace,
    AppointmentRemindersAdminKeys
  >(appointmentRemindersAdminNamespace);

  const [loading, setLoading] = React.useState(!!fromId);
  const [appointmentReminder, setAppointmentReminder] =
    React.useState<AppointmentReminderUpdateModel>();

  React.useEffect(() => {
    let cancelled = false;

    const fn = async () => {
      setLoading(true);

      try {
        const result = await getAppointmentReminder(appId, fromId);
        const {
          _id: _,
          updatedAt: __,
          appId: ___,
          organizationId: ____,
          ...appointmentReminderData
        } = result;

        if (cancelled) return;

        setAppointmentReminder(
          appointmentReminderData as AppointmentReminderUpdateModel,
        );
      } catch (e: any) {
        console.error(e);

        if (!cancelled) {
          toast.error(t("statusText.error_loading_appointment_reminder"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (appId && fromId) {
      fn();
    }

    return () => {
      cancelled = true;
    };
  }, [appId, fromId]);

  return (
    <AutoSkeleton loading={loading}>
      <AppointmentReminderForm
        appId={appId}
        initialData={appointmentReminder}
      />
    </AutoSkeleton>
  );
};
