"use client";

import { useI18n } from "@hacado/i18n/client";
import { NameIdentityBar } from "@hacado/ui-admin/name-identity-bar";
import { PageHeader } from "@hacado/ui-admin/page-header";
import { SaveButton } from "@hacado/ui-admin/save-button";
import { Sortable } from "@hacado/ui-admin/sortable";
import { SwitchCardFormItem } from "@hacado/ui-admin/switch-card-form-item";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@hacado/ui/form";
import { useDebounceCacheFn } from "@hacado/ui/hooks";
import { Input } from "@hacado/ui/input";
import { toastPromise } from "@hacado/ui/sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { checkFormNameUnique, createForm, updateForm } from "../../actions";
import {
  defaultOneLineLength,
  FormUpdateModel,
  getFormSchemaWithUniqueCheck,
} from "../../models";
import {
  FormsAdminAllKeys,
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";
import { FormFieldCard } from "./field-card";

export const FormEditForm: React.FC<{
  initialData?: FormUpdateModel & { _id?: string; isArchived?: boolean };
  appId: string;
}> = ({ initialData, appId }) => {
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);
  const tAdmin = useI18n("admin");

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const cachedUniqueNameCheck = useDebounceCacheFn(checkFormNameUnique, 300);

  const formSchema = useMemo(
    () =>
      getFormSchemaWithUniqueCheck(
        (name) => cachedUniqueNameCheck(appId, name, initialData?._id),
        "app_forms_admin.validation.form.name.unique" satisfies FormsAdminAllKeys,
      ),
    [cachedUniqueNameCheck, appId, initialData?._id],
  );

  type FormValues = z.infer<typeof formSchema>;
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: initialData || {
      name: "",
      fields: [],
      notifications: {
        enabled: true,
      },
      requireCustomerId: false,
    },
  });

  const isArchived = !!initialData?._id && initialData?.isArchived;
  const notificationsEnabled = form.watch("notifications.enabled");
  const fieldsDisabled = loading || isArchived;

  const {
    fields: fieldsFields,
    append: appendField,
    remove: removeField,
    swap: swapFields,
  } = useFieldArray({
    control: form.control,
    name: "fields",
  });

  const { invalid: fieldsInvalid } = form.getFieldState("fields");

  const sortFields = (activeId: string, overId: string) => {
    const activeIndex = fieldsFields.findIndex((x) => x.id === activeId);

    const overIndex = fieldsFields.findIndex((x) => x.id === overId);

    if (activeIndex < 0 || overIndex < 0) return;

    swapFields(activeIndex, overIndex);
  };

  const addNewField = () => {
    appendField({
      type: "oneLine",
      name: "",
      label: "",
      description: "",
      required: false,
      data: { minLength: 1, maxLength: defaultOneLineLength },
    });
  };

  const fieldsIds = fieldsFields.map((x) => x.id);

  const breadcrumbItems = useMemo(
    () => [
      { title: tAdmin("navigation.dashboard"), link: "/dashboard" },
      { title: t("app.displayName"), link: "/dashboard/forms" },
      {
        title: initialData?._id
          ? t("app.pages.edit.title")
          : t("app.pages.new.label"),
        link: initialData?._id
          ? `/dashboard/forms/edit?id=${initialData._id}`
          : "/dashboard/forms/new",
      },
    ],
    [initialData?._id, t, tAdmin],
  );

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      const fn = async () => {
        if (!initialData?._id) {
          const result = await createForm(appId, data);
          router.push(`/dashboard/forms/edit?id=${result._id}`);
        } else {
          await updateForm(appId, initialData._id, data);
          router.refresh();
        }
      };

      await toastPromise(fn(), {
        success: t("form.toasts.changesSaved"),
        error: t("form.toasts.requestError"),
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <div className="flex flex-1 flex-col gap-4">
        <Breadcrumbs items={breadcrumbItems} />
        <PageHeader
          text={
            <div className="my-2 flex w-full min-w-0 flex-col gap-1">
              <NameIdentityBar
                layout="inline"
                loading={loading}
                isNew={!initialData?._id}
                label={t("form.name.label")}
                placeholder={t("form.name.placeholder")}
                description={t("form.name.description")}
              />
              {isArchived ? (
                <p className="text-xs text-muted-foreground md:text-sm">
                  {t("form.archivedNotice")}
                </p>
              ) : null}
            </div>
          }
        />
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="h-full w-full space-y-8"
        >
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Sortable
                title={t("form.fields.title")}
                invalid={fieldsInvalid}
                ids={fieldsIds}
                onSort={sortFields}
                onAdd={addNewField}
                disabled={fieldsDisabled}
              >
                <div className="flex flex-col gap-4">
                  {fieldsFields.map((item, index) => {
                    return (
                      <FormFieldCard
                        form={form}
                        name={`fields.${index}`}
                        disabled={fieldsDisabled}
                        item={item}
                        key={item.id}
                        remove={() => removeField(index)}
                      />
                    );
                  })}
                </div>
              </Sortable>
            </div>
            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="notifications.enabled"
                render={({ field }) => {
                  return (
                    <SwitchCardFormItem
                      label={t("form.notifications.enabled.label")}
                      description={t("form.notifications.enabled.description")}
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                      disabled={fieldsDisabled}
                    >
                      {notificationsEnabled && (
                        <FormField
                          control={form.control}
                          name="notifications.email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("form.notifications.email.label")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  disabled={fieldsDisabled}
                                  {...field}
                                  value={field.value ?? ""}
                                />
                              </FormControl>
                              <FormDescription>
                                {t("form.notifications.email.description")}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </SwitchCardFormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="requireCustomerId"
                render={({ field }) => (
                  <SwitchCardFormItem
                    label={t("form.requireCustomerId.label")}
                    description={t("form.requireCustomerId.description")}
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                    disabled={fieldsDisabled}
                  />
                )}
              />
            </div>
          </div>
          <SaveButton form={form} disabled={fieldsDisabled} />
        </form>
      </div>
    </Form>
  );
};
