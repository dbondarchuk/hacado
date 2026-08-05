"use client";

import { authClient } from "@/app/auth-client";
import { LanguageOptions } from "@/constants/texts";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserUpdate, userUpdateSchema } from "@hacado/api-sdk";
import { languages } from "@hacado/i18n";
import { useI18n } from "@hacado/i18n/client";
import { PlateMarkdownEditor } from "@hacado/rte";
import { CalendarSourceConfiguration } from "@hacado/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Combobox,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Input,
  PhoneInput,
  toast,
  toastPromise,
} from "@hacado/ui";
import {
  AppSelector,
  AssetSelectorDialog,
  NonSortable,
  SaveButton,
} from "@hacado/ui-admin";
import { Lock, Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { CalendarSourceCard } from "./calendar-source-card";
import { EmailChangeDialog } from "./email-change-dialog";
import { PasswordChangeDialog } from "./password-change-dialog";

export type ProfileFormProps = {
  values: UserUpdate & { email: string };
  canManageCalendarSources?: boolean;
  canManageMeetingUrlProvider?: boolean;
  showSecuritySection?: boolean;
  /** When true, language change reloads the page and session is refetched. */
  isSelfProfile?: boolean;
  onSave: (data: UserUpdate) => Promise<void>;
};

export const ProfileForm: React.FC<ProfileFormProps> = ({
  values,
  canManageCalendarSources = true,
  canManageMeetingUrlProvider = true,
  showSecuritySection = true,
  isSelfProfile = false,
  onSave,
}) => {
  const searchParams = useSearchParams();
  const emailChanged = searchParams.get("emailChanged");
  const [avatarDialogOpen, setAvatarDialogOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const session = authClient.useSession();

  const t = useI18n("admin");
  const router = useRouter();

  const form = useForm<UserUpdate>({
    resolver: zodResolver(userUpdateSchema),
    mode: "all",
    reValidateMode: "onChange",
    values: { ...values },
  });
  const {
    fields: calendarSourceFields,
    append: appendCalendarSource,
    remove: removeCalendarSource,
    update: updateCalendarSource,
    insert: insertCalendarSource,
  } = useFieldArray({
    control: form.control,
    name: "calendarSources",
    keyName: "fields_id",
  });

  const onSubmit = async (data: UserUpdate) => {
    try {
      setLoading(true);
      const payload: UserUpdate = {
        ...data,
        calendarSources: canManageCalendarSources
          ? data.calendarSources
          : values.calendarSources,
        meetingUrlProviderAppId: canManageMeetingUrlProvider
          ? data.meetingUrlProviderAppId
          : values.meetingUrlProviderAppId,
      };
      await toastPromise(onSave(payload), {
        success: t("users.profile.toasts.changesSaved"),
        error: t("users.profile.toasts.requestError"),
      });

      if (isSelfProfile && data.language !== values.language && window?.location) {
        setTimeout(() => window.location.reload(), 1000);
      } else {
        if (isSelfProfile) {
          session.refetch();
        }
        router.refresh();
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSelfProfile && emailChanged === "true") {
      toast.success(
        t("users.profile.emailChange.toasts.emailChangedSuccessfully"),
      );
    }
  }, [emailChanged, isSelfProfile, t]);

  const image = form.watch("image");
  const name = form.watch("name");
  const calendarSourceIds = React.useMemo(
    () => calendarSourceFields.map((x) => x.fields_id),
    [calendarSourceFields],
  );

  const showIntegrationsColumn =
    canManageCalendarSources || canManageMeetingUrlProvider;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <Card className="lg:col-span-4">
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("users.profile.form.photoSectionTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 items-center">
                <img
                  src={image ?? "/unknown-person.png"}
                  alt={t("users.profile.form.imageAlt")}
                  className="h-24 w-24 rounded-full object-cover"
                />
                <div className="text-center">
                  <p className="text-lg font-semibold">{name}</p>
                  <p className="text-base text-muted-foreground">
                    {values.email}
                  </p>
                </div>
                <div className="w-full">
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="w-full">
                            <AssetSelectorDialog
                              accept={["image/*"]}
                              isOpen={avatarDialogOpen}
                              addTo={{
                                description: `${values.name} - Profile Photo`,
                              }}
                              close={() => setAvatarDialogOpen(false)}
                              onSelected={(asset) => {
                                field.onChange(`/assets/${asset.filename}`);
                                field.onBlur();
                              }}
                            />
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                className="w-full"
                                disabled={loading}
                                onClick={() => setAvatarDialogOpen(true)}
                              >
                                {t("users.profile.form.changePhoto")}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={loading}
                                onClick={() => {
                                  field.onChange(null);
                                  field.onBlur();
                                }}
                              >
                                {t("users.profile.form.removePhoto")}
                              </Button>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-8">
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("users.profile.form.detailsSectionTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("users.profile.form.name")}</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder={t("users.profile.form.namePlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("users.profile.form.phone")}</FormLabel>
                      <FormControl>
                        <PhoneInput
                          {...field}
                          disabled={loading}
                          label={t("users.profile.form.phone")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("users.profile.form.language")}</FormLabel>
                      <FormControl>
                        <Combobox
                          values={languages.map((language) => ({
                            label: LanguageOptions[language],
                            value: language,
                          }))}
                          className="w-full"
                          value={field.value}
                          onItemSelect={(value) => {
                            field.onChange(value);
                            field.onBlur();
                          }}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <div
          className={
            showIntegrationsColumn
              ? "grid grid-cols-1 gap-4 lg:grid-cols-2"
              : "grid grid-cols-1 gap-4"
          }
        >
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("users.profile.form.bio")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <PlateMarkdownEditor
                        {...field}
                        value={field.value ?? ""}
                        disabled={loading}
                        placeholder={t("users.profile.form.bioPlaceholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {showIntegrationsColumn ? (
            <div className="flex flex-col gap-4">
              {canManageCalendarSources ? (
                <NonSortable
                  title={t("users.profile.form.calendarSources.title")}
                  ids={calendarSourceIds}
                  onAdd={() =>
                    appendCalendarSource({
                      type: "ics",
                    } as Partial<CalendarSourceConfiguration> as CalendarSourceConfiguration)
                  }
                >
                  <div className="flex flex-grow flex-col gap-4">
                    {calendarSourceFields.map((item, index) => (
                      <CalendarSourceCard
                        form={form}
                        item={item as unknown as CalendarSourceConfiguration}
                        key={item.fields_id}
                        name={`calendarSources.${index}`}
                        disabled={loading}
                        remove={() => removeCalendarSource(index)}
                        clone={() =>
                          insertCalendarSource(index + 1, {
                            ...form.getValues(`calendarSources.${index}`)!,
                          })
                        }
                        update={(newValue) =>
                          updateCalendarSource(index, newValue)
                        }
                        excludeIds={form
                          .getValues("calendarSources")
                          ?.map(({ appId }) => appId)
                          .filter(
                            (appId) =>
                              appId !==
                              form.getValues(`calendarSources.${index}`)
                                ?.appId,
                          )}
                      />
                    ))}
                  </div>
                </NonSortable>
              ) : null}

              {canManageMeetingUrlProvider ? (
                <Card>
                  <CardHeader className="border-b">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("users.profile.form.meetingUrlProvider.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <FormField
                      control={form.control}
                      name="meetingUrlProviderAppId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("users.profile.form.meetingUrlProvider.app")}{" "}
                            <InfoTooltip>
                              {t(
                                "users.profile.form.meetingUrlProvider.appTooltip",
                              )}
                            </InfoTooltip>
                          </FormLabel>
                          <FormControl>
                            <AppSelector
                              scope="meeting-url-provider"
                              disabled={loading}
                              value={field.value ?? undefined}
                              onItemSelect={(value) => {
                                field.onChange(value ?? null);
                                field.onBlur();
                              }}
                              allowClear
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              ) : null}
            </div>
          ) : null}
        </div>
        {showSecuritySection ? (
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("users.profile.security.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-medium">
                      {t("users.profile.security.email")}
                    </p>
                    <p className="text-base text-muted-foreground">
                      {values.email}
                    </p>
                  </div>
                </div>
                <EmailChangeDialog currentEmail={values.email} />
              </div>
              <div className="h-px w-full bg-border" />
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-medium">
                      {t("users.profile.security.password")}
                    </p>
                    <p className="text-base text-muted-foreground">
                      {t("users.profile.security.passwordDescription")}
                    </p>
                  </div>
                </div>
                <PasswordChangeDialog />
              </div>
            </CardContent>
          </Card>
        ) : null}
        <SaveButton form={form} disabled={loading} />
      </form>
    </Form>
  );
};
