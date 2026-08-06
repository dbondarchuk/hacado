"use client";

import { authClient } from "@/app/auth-client";
import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { I18nRichText } from "@hacado/i18n/components";
import {
  AppointmentOptionUpdateModel,
  DatabaseId,
  getAppointmentOptionSchemaWithUniqueCheck,
} from "@hacado/types";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  cn,
  Form,
  ResponsiveTabsList,
  Spinner,
  Tabs,
  TabsContent,
  TabsTrigger,
  toastPromise,
  useDebounceCacheFn,
} from "@hacado/ui";
import { SaveButton } from "@hacado/ui-admin";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { AddonsTab } from "./tabs/addons";
import { CancellationsTab } from "./tabs/cancellations";
import { DuplicatesTab } from "./tabs/duplicates";
import { FieldsTab } from "./tabs/fields";
import { GeneralTab } from "./tabs/general";
import { MembersTab } from "./tabs/members";
import { PaymentsTab } from "./tabs/payments";
import { ReschedulesTab } from "./tabs/reschedules";

export const OptionForm: React.FC<{
  initialData?: AppointmentOptionUpdateModel & Partial<DatabaseId>;
}> = ({ initialData }) => {
  const t = useI18n("admin");

  const cachedUniqueNameCheck = useDebounceCacheFn(
    adminApi.serviceOptions.checkServiceOptionUniqueName,
    300,
  );

  const formSchema = getAppointmentOptionSchemaWithUniqueCheck(
    (name) => cachedUniqueNameCheck(name, initialData?._id),
    "services.options.nameUnique",
  );

  type FormValues = z.infer<typeof formSchema>;

  const [loading, setLoading] = React.useState(false);
  const [showAvailabilityDialog, setShowAvailabilityDialog] =
    React.useState(false);
  const [newOption, setNewOption] = React.useState<{
    id: string;
    name: string;
  } | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = React.useState(false);
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: initialData || {
      requireDeposit: "inherit",
      isOnline: false,
      isAutoConfirm: "inherit",
      duplicateAppointmentCheck: {
        enabled: false,
      },
      staff: [],
    },
  });

  React.useEffect(() => {
    if (initialData?._id || initialData?.staff?.length) return;
    const memberId = (session?.user as { memberId?: string } | undefined)
      ?.memberId;
    if (!memberId) return;
    const current = form.getValues("staff");
    if (!current?.length) {
      form.setValue("staff", [{ memberId }]);
    }
  }, [session?.user, initialData, form]);

  const triggerValidation = useCallback(() => {
    form.trigger();
  }, [form]);

  React.useEffect(() => triggerValidation(), [triggerValidation]);

  const handleAvailabilityDialogOpenChange = useCallback(
    (open: boolean) => {
      if (open || !availabilityLoading) {
        setShowAvailabilityDialog(open);
      }
    },
    [availabilityLoading],
  );

  const navigateToOptionEdit = useCallback(() => {
    if (!newOption?.id) return;
    router.push(`/dashboard/services/options/${newOption.id}`);
  }, [newOption?.id, router]);

  const onSkipAddingToAvailability = useCallback(() => {
    setShowAvailabilityDialog(false);
    navigateToOptionEdit();
  }, [navigateToOptionEdit]);

  const onAddToAvailability = useCallback(async () => {
    if (!newOption?.id) return;
    try {
      setAvailabilityLoading(true);
      await toastPromise(
        adminApi.booking.addBookingAvailableOption(newOption.id),
        {
          success: t(
            "services.options.form.addToAvailabilityDialog.toasts.added",
          ),
          error: t(
            "services.options.form.addToAvailabilityDialog.toasts.requestError",
          ),
        },
      );
      setShowAvailabilityDialog(false);
      navigateToOptionEdit();
    } catch (error) {
      console.error(error);
    } finally {
      setAvailabilityLoading(false);
    }
  }, [navigateToOptionEdit, newOption?.id, t]);

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      const payload =
        data.durationType === "flexible"
          ? {
              ...data,
              staff: data.staff?.map(
                ({ durationOverride: _durationOverride, ...assignment }) =>
                  assignment,
              ),
            }
          : data;

      const fn = async () => {
        if (!initialData?._id) {
          const { _id } =
            await adminApi.serviceOptions.createServiceOption(payload);
          setNewOption({ id: _id, name: data.name });
          setShowAvailabilityDialog(true);
        } else {
          await adminApi.serviceOptions.updateServiceOption(
            initialData._id,
            payload,
          );

          router.refresh();
        }
      };

      await toastPromise(fn(), {
        success: t("services.options.form.toasts.changesSaved"),
        error: t("services.options.form.toasts.requestError"),
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-8 relative flex flex-col gap-2 pb-4"
      >
        <Tabs
          onValueChange={triggerValidation}
          defaultValue={"general"}
          className="space-y-4"
          orientation="vertical"
        >
          <ResponsiveTabsList className="w-full flex flex-row gap-2">
            <TabsTrigger
              value="general"
              className={cn(
                form.getFieldState("name").invalid ||
                  form.getFieldState("description").invalid ||
                  form.getFieldState("duration").invalid ||
                  form.getFieldState("price").invalid ||
                  form.getFieldState("isAutoConfirm").invalid ||
                  form.getFieldState("isOnline").invalid
                  ? "text-destructive"
                  : "",
              )}
            >
              {t("services.options.form.tabs.general")}
            </TabsTrigger>
            <TabsTrigger
              value="fields"
              className={cn(
                form.getFieldState("fields").invalid ? "text-destructive" : "",
              )}
            >
              {t("services.options.form.tabs.fields")}
            </TabsTrigger>
            <TabsTrigger
              value="addons"
              className={cn(
                form.getFieldState("addons").invalid ? "text-destructive" : "",
              )}
            >
              {t("services.options.form.tabs.addons")}
            </TabsTrigger>
            <TabsTrigger
              value="staff"
              className={cn(
                form.getFieldState("staff").invalid ? "text-destructive" : "",
              )}
            >
              {t("services.options.form.tabs.staff")}
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className={cn(
                form.getFieldState("requireDeposit").invalid ||
                  form.getFieldState("depositPercentage").invalid
                  ? "text-destructive"
                  : "",
              )}
            >
              {t("services.options.form.tabs.payments")}
            </TabsTrigger>
            <TabsTrigger
              value="duplicates"
              className={cn(
                form.getFieldState("duplicateAppointmentCheck").invalid
                  ? "text-destructive"
                  : "",
              )}
            >
              {t("services.options.form.tabs.duplicates")}
            </TabsTrigger>
            <TabsTrigger
              value="cancellations"
              className={cn(
                form.getFieldState("cancellationPolicy").invalid
                  ? "text-destructive"
                  : "",
              )}
            >
              {t("services.options.form.cancellationPolicy.title")}
            </TabsTrigger>
            <TabsTrigger
              value="reschedules"
              className={cn(
                form.getFieldState("reschedulePolicy").invalid
                  ? "text-destructive"
                  : "",
              )}
            >
              {t("services.options.form.reschedulePolicy.title")}
            </TabsTrigger>
          </ResponsiveTabsList>
          <TabsContent value="general">
            <GeneralTab form={form} disabled={loading} />
          </TabsContent>
          <TabsContent value="payments">
            <PaymentsTab form={form} disabled={loading} />
          </TabsContent>
          <TabsContent value="duplicates">
            <DuplicatesTab form={form} disabled={loading} />
          </TabsContent>
          <TabsContent value="fields">
            <FieldsTab form={form} disabled={loading} />
          </TabsContent>
          <TabsContent value="addons">
            <AddonsTab form={form} disabled={loading} />
          </TabsContent>
          <TabsContent value="cancellations">
            <CancellationsTab form={form} disabled={loading} />
          </TabsContent>
          <TabsContent value="staff">
            <MembersTab form={form} disabled={loading} />
          </TabsContent>
          <TabsContent value="reschedules">
            <ReschedulesTab form={form} disabled={loading} />
          </TabsContent>
        </Tabs>
        <SaveButton form={form} disabled={loading || availabilityLoading} />
      </form>
      <AlertDialog
        open={showAvailabilityDialog}
        onOpenChange={handleAvailabilityDialogOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("services.options.form.addToAvailabilityDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <I18nRichText
                namespace="admin"
                text="services.options.form.addToAvailabilityDialog.description"
                args={{
                  name: newOption?.name ?? "",
                }}
              />
            </AlertDialogDescription>
            <AlertDialogDescription>
              {t.rich(
                "services.options.form.addToAvailabilityDialog.manageHint",
                {
                  link: (children: React.ReactNode) => (
                    <Link
                      className="underline underline-offset-4"
                      href="/dashboard/settings/appointments"
                    >
                      {children}
                    </Link>
                  ),
                },
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={availabilityLoading}
              onClick={onSkipAddingToAvailability}
            >
              {t("services.options.form.addToAvailabilityDialog.actions.skip")}
            </AlertDialogCancel>
            <Button
              disabled={availabilityLoading}
              onClick={onAddToAvailability}
            >
              {availabilityLoading && <Spinner />}
              {t("services.options.form.addToAvailabilityDialog.actions.add")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
};
