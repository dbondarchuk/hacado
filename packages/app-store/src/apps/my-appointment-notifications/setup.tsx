"use client";

import { configurationApi } from "@hacado/api-sdk/admin/configuration";
import { useI18n } from "@hacado/i18n/client";
import { zEmail } from "@hacado/types/utils";
import { ConnectedAppStatusMessage } from "@hacado/ui-admin/connected-app-properties";
import {
  useCanProcessOtherMembersAppointments,
  useHasPermission,
} from "@hacado/ui-admin/context";
import { SaveButton } from "@hacado/ui-admin/save-button";
import { SwitchCardFormItem } from "@hacado/ui-admin/switch-card-form-item";
import { Alert, AlertDescription } from "@hacado/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@hacado/ui/form";
import { Link } from "@hacado/ui/link";
import { PhoneInput } from "@hacado/ui/phone-input";
import { TagInput } from "@hacado/ui/tag-input";
import React from "react";
import { ProcessOtherMembersAppointmentsField } from "../../components/process-other-members-appointments-field";
import { useConnectedAppSetup } from "../../hooks/use-connected-app-setup";
import { MyAppointmentNotificationsApp } from "./app";
import {
  defaultMyAppointmentNotificationsEvents,
  MyAppointmentNotificationEventKey,
  myAppointmentNotificationEventKeys,
  MyAppointmentNotificationsConfiguration,
  myAppointmentNotificationsConfigurationSchema,
} from "./models";
import {
  MyAppointmentNotificationsAdminKeys,
  MyAppointmentNotificationsAdminNamespace,
  myAppointmentNotificationsAdminNamespace,
} from "./translations/types";

export const MyAppointmentNotificationsAppSetup: React.FC<{
  appId: string;
}> = ({ appId }) => {
  const canUseText = useHasPermission("app", "installPrivileged");
  const canProcessOthers = useCanProcessOtherMembersAppointments();
  const [smsEnabled, setSmsEnabled] = React.useState<boolean | null>(null);

  const { appStatus, form, isLoading, isDataLoading, onSubmit } =
    useConnectedAppSetup<MyAppointmentNotificationsConfiguration>({
      appId,
      appName: MyAppointmentNotificationsApp.name,
      schema: myAppointmentNotificationsConfigurationSchema,
      initialData: {
        events: defaultMyAppointmentNotificationsEvents(),
      } as MyAppointmentNotificationsConfiguration,
    });

  const t = useI18n<
    MyAppointmentNotificationsAdminNamespace,
    MyAppointmentNotificationsAdminKeys
  >(myAppointmentNotificationsAdminNamespace);

  React.useEffect(() => {
    let active = true;

    configurationApi
      .getConfiguration("textMessaging")
      .then((value) => {
        if (active) setSmsEnabled(value?.enabled === true);
      })
      .catch(() => {
        if (active) setSmsEnabled(false);
      });

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (isDataLoading) return;

    const values = form.getValues();

    if (!values.events) {
      form.setValue("events", defaultMyAppointmentNotificationsEvents(), {
        shouldDirty: false,
        shouldValidate: false,
      });
    }
  }, [form, isDataLoading]);

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-8"
        >
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("form.email.label")}</FormLabel>
                  <FormControl>
                    <TagInput
                      {...field}
                      value={
                        field.value && !Array.isArray(field.value)
                          ? [field.value]
                          : (field.value as readonly string[])
                      }
                      disabled={isLoading}
                      placeholder={t("form.email.placeholder")}
                      tagValidator={zEmail}
                    />
                  </FormControl>
                  <FormDescription>{t("form.email.tooltip")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {canUseText ? (
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>{t("form.phone.label")}</FormLabel>
                    <FormControl>
                      <PhoneInput
                        {...field}
                        label={t("form.phone.placeholder")}
                      />
                    </FormControl>
                    <FormDescription>{t("form.phone.tooltip")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
            {canProcessOthers ? (
              <ProcessOtherMembersAppointmentsField
                control={form.control}
                label={t("form.processOtherMembersAppointments.label")}
                description={t(
                  "form.processOtherMembersAppointments.description",
                )}
                isLoading={isLoading}
              />
            ) : null}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 items-stretch gap-4">
            {myAppointmentNotificationEventKeys.map((eventKey) => (
              <EventCard
                key={eventKey}
                form={form}
                eventKey={eventKey}
                disabled={isLoading}
                canUseText={canUseText}
                smsEnabled={smsEnabled}
                t={t}
              />
            ))}
          </div>
          <SaveButton form={form} disabled={isLoading} isLoading={isLoading} />
        </form>
      </Form>
      {appStatus ? (
        <ConnectedAppStatusMessage
          status={appStatus.status}
          statusText={appStatus.statusText}
        />
      ) : null}
    </>
  );
};

const EventCard: React.FC<{
  form: ReturnType<
    typeof useConnectedAppSetup<MyAppointmentNotificationsConfiguration>
  >["form"];
  eventKey: MyAppointmentNotificationEventKey;
  disabled?: boolean;
  canUseText: boolean;
  smsEnabled: boolean | null;
  t: ReturnType<
    typeof useI18n<
      MyAppointmentNotificationsAdminNamespace,
      MyAppointmentNotificationsAdminKeys
    >
  >;
}> = ({ form, eventKey, disabled, canUseText, smsEnabled, t }) => {
  const emailEnabled = form.watch(`events.${eventKey}.emailEnabled`) === true;
  const textEnabled = form.watch(`events.${eventKey}.textEnabled`) === true;

  return (
    <FormField
      control={form.control}
      name={`events.${eventKey}.enabled`}
      render={({ field }) => (
        <SwitchCardFormItem
          alwaysItemsStart
          label={t(`form.events.${eventKey}.enabled.label`)}
          description={t(`form.events.${eventKey}.enabled.description`)}
          checked={field.value === true}
          disabled={disabled}
          onCheckedChange={(checked) => {
            field.onChange(checked);

            if (checked) {
              if (
                form.getValues(`events.${eventKey}.emailEnabled`) !== true &&
                form.getValues(`events.${eventKey}.textEnabled`) !== true
              ) {
                form.setValue(`events.${eventKey}.emailEnabled`, true, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            }
          }}
        >
          {field.value === true ? (
            <div className="flex flex-col gap-4 pt-2">
              <p className="text-sm font-medium">{t("form.delivery.label")}</p>
              {!emailEnabled && !textEnabled ? (
                <p className="text-destructive text-sm">
                  {t("form.channel.required")}
                </p>
              ) : null}
              <FormField
                control={form.control}
                name={`events.${eventKey}.emailEnabled`}
                render={({ field: emailField }) => (
                  <SwitchCardFormItem
                    alwaysItemsStart
                    noCard
                    label={t("form.emailChannel.label")}
                    description={t("form.emailChannel.description")}
                    checked={emailField.value === true}
                    disabled={disabled}
                    onCheckedChange={emailField.onChange}
                  />
                )}
              />
              {canUseText ? (
                <FormField
                  control={form.control}
                  name={`events.${eventKey}.textEnabled`}
                  render={({ field: textField }) => (
                    <SwitchCardFormItem
                      alwaysItemsStart
                      noCard="borderTop"
                      label={t("form.textMessage.label")}
                      description={t("form.textMessage.description")}
                      checked={textField.value === true}
                      disabled={
                        disabled ||
                        (smsEnabled === false && textField.value !== true)
                      }
                      onCheckedChange={(value) => {
                        if (value && smsEnabled === false) return;

                        textField.onChange(value);
                      }}
                    >
                      {smsEnabled === false ? (
                        <Alert>
                          <AlertDescription>
                            {t("form.textMessage.smsDisabled")}{" "}
                            <Link href="/dashboard/settings/text-messaging">
                              {t("form.textMessage.smsDisabledAction")}
                            </Link>
                          </AlertDescription>
                        </Alert>
                      ) : null}
                    </SwitchCardFormItem>
                  )}
                />
              ) : null}
            </div>
          ) : null}
        </SwitchCardFormItem>
      )}
    />
  );
};
