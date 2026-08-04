"use client";

import { useI18n } from "@timelish/i18n/client";
import { AutoSkeleton, toast } from "@timelish/ui";
import { useSearchParams } from "next/navigation";
import React from "react";
import { getAppointmentNotification } from "./actions";
import { AppointmentNotificationForm } from "./form";
import { AppointmentNotificationUpdateModel } from "./models";
import {
  AppointmentNotificationsAdminKeys,
  AppointmentNotificationsAdminNamespace,
  appointmentNotificationsAdminNamespace,
} from "./translations/types";

export const NewAppointmentNotificationPage: React.FC<{ appId: string }> = ({
  appId,
}) => {
  const searchParams = useSearchParams();
  const fromId = searchParams.get("from") as string;
  const t = useI18n<
    AppointmentNotificationsAdminNamespace,
    AppointmentNotificationsAdminKeys
  >(appointmentNotificationsAdminNamespace);

  const [loading, setLoading] = React.useState(!!fromId);
  const [appointmentNotification, setAppointmentNotification] =
    React.useState<AppointmentNotificationUpdateModel>();

  React.useEffect(() => {
    const fn = async () => {
      setLoading(true);
      try {
        const result = await getAppointmentNotification(appId, fromId);
        const {
          _id: _,
          updatedAt: ___,
          ...appointmentNotificationData
        } = result;

        setAppointmentNotification(appointmentNotificationData);
        setLoading(false);
      } catch (e: any) {
        console.error(e);
        toast.error(t("statusText.error_loading_appointment_notification"));
      } finally {
        setLoading(false);
      }
    };

    if (appId && fromId) {
      fn();
    }
  }, [appId, fromId]);

  return (
    <AutoSkeleton loading={loading}>
      <AppointmentNotificationForm
        appId={appId}
        initialData={appointmentNotification}
      />
    </AutoSkeleton>
  );
};
