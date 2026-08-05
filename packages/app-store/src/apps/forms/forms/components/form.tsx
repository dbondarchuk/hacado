"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useI18n } from "@hacado/i18n/client";
import {
  BooleanSelect,
  Breadcrumbs,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Input,
  toastPromise,
  useDebounceCacheFn,
} from "@hacado/ui";
import { SaveButton, Sortable } from "@hacado/ui-admin";
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

  const isArchived = !!initialData?._id && !initialData?.isArchived;
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
        title: initialData?._id ? initialData.name : t("app.pages.new.label"),
        link: initialData?._id
          ? `/dashboard/forms/${initialData._id}`
          : "/dashboard/forms/new",
      },
    ],
    [initialData?._id, initialData?.name, t, tAdmin],
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
      <Breadcrumbs items={breadcrumbItems} />
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full h-full space-y-8"
      >
        <div className="flex flex-col gap-2 w-full">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input
                    className="md:text-xl lg:text-2xl font-bold tracking-tight border-0 w-full px-0"
                    autoFocus
                    h={"lg"}
                    disabled={loading}
                    placeholder={t("form.name.placeholder")}
                    {...field}
                  />
                </FormControl>
                {isArchived && (
                  <p className="text-sm text-muted-foreground">
                    {t("form.archivedNotice")}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
                  <FormItem>
                    <FormLabel>
                      <span>{t("form.notifications.enabled.label")}</span>{" "}
                      <InfoTooltip>
                        {t("form.notifications.enabled.description")}
                      </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <BooleanSelect
                        value={field.value ?? false}
                        onValueChange={field.onChange}
                        disabled={fieldsDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            {notificationsEnabled && (
              <FormField
                control={form.control}
                name="notifications.email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <span>{t("form.notifications.email.label")}</span>{" "}
                      <InfoTooltip>
                        {t("form.notifications.email.description")}
                      </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        disabled={fieldsDisabled}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="requireCustomerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <span>{t("form.requireCustomerId.label")}</span>{" "}
                    <InfoTooltip>
                      {t("form.requireCustomerId.description")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <BooleanSelect
                      value={field.value ?? false}
                      onValueChange={field.onChange}
                      disabled={fieldsDisabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <SaveButton form={form} disabled={fieldsDisabled} />
      </form>
    </Form>
  );
};
