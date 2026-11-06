"use client";

import { useI18n } from "@hacado/i18n/client";
import { AutoSkeleton } from "@hacado/ui/auto-skeleton";
import { toast } from "@hacado/ui/sonner";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { getAppointmentReminder } from "./actions";
import { AppointmentReminderForm } from "./form";
import { AppointmentReminder } from "./models";
import {
  AppointmentRemindersAdminKeys,
  AppointmentRemindersAdminNamespace,
  appointmentRemindersAdminNamespace,
} from "./translations/types";

export const EditAppointmentReminderPage: React.FC<{ appId: string }> = ({
  appId,
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const t = useI18n<
    AppointmentRemindersAdminNamespace,
    AppointmentRemindersAdminKeys
  >(appointmentRemindersAdminNamespace);

  const [loading, setLoading] = React.useState(true);
  const [appointmentReminder, setAppointmentReminder] =
    React.useState<AppointmentReminder>();

  React.useEffect(() => {
    if (!id) {
      router.replace("/dashboard/communications/appointment-reminders");
      return;
    }

    const fn = async () => {
      setLoading(true);
      try {
        const result = await getAppointmentReminder(appId, id);
        if (!result) {
          router.replace("/dashboard/communications/appointment-reminders");
          return;
        }

        setAppointmentReminder(result as AppointmentReminder);
        setLoading(false);
      } catch (e: any) {
        console.error(e);
        toast.error(t("statusText.error_loading_appointment_reminder"));
      } finally {
        setLoading(false);
      }
    };

    fn();
  }, [id, appId, router, t]);

  return (
    <AutoSkeleton loading={loading}>
      <AppointmentReminderForm
        appId={appId}
        initialData={appointmentReminder}
      />
    </AutoSkeleton>
  );
};
