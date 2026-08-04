"use client";

import { useI18n } from "@timelish/i18n/client";
import { AutoSkeleton, toast } from "@timelish/ui";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { getAppointmentNotification } from "./actions";
import { AppointmentNotificationForm } from "./form";
import { AppointmentNotification } from "./models";
import {
  AppointmentNotificationsAdminKeys,
  AppointmentNotificationsAdminNamespace,
  appointmentNotificationsAdminNamespace,
} from "./translations/types";

export const EditAppointmentNotificationPage: React.FC<{ appId: string }> = ({
  appId,
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const t = useI18n<
    AppointmentNotificationsAdminNamespace,
    AppointmentNotificationsAdminKeys
  >(appointmentNotificationsAdminNamespace);

  const [loading, setLoading] = React.useState(true);
  const [appointmentNotification, setAppointmentNotification] =
    React.useState<AppointmentNotification>();

  React.useEffect(() => {
    if (!id) {
      router.replace("/dashboard/communications/appointment-notifications");
      return;
    }

    const fn = async () => {
      setLoading(true);
      try {
        const result = await getAppointmentNotification(appId, id);
        if (!result) {
          router.replace("/dashboard/communications/appointment-notifications");
          return;
        }

        setAppointmentNotification(result as AppointmentNotification);
        setLoading(false);
      } catch (e: any) {
        console.error(e);
        toast.error(t("statusText.error_loading_appointment_notification"));
      } finally {
        setLoading(false);
      }
    };

    fn();
  }, [id]);

  return (
    <AutoSkeleton loading={loading}>
      <AppointmentNotificationForm
        appId={appId}
        initialData={appointmentNotification}
      />
    </AutoSkeleton>
  );
};
