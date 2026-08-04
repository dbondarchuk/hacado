"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useI18n } from "@timelish/i18n/client";
import {
  Breadcrumbs,
  Card,
  CardContent,
  CardHeader,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  toastPromise,
} from "@timelish/ui";
import { CustomerSelector, SaveButton } from "@timelish/ui-admin";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { createFormResponse, updateFormResponse } from "../../actions";
import { FormModel, FormResponseModel } from "../../models";
import { getFormResponseSchema } from "../../models/utils";
import {
  FormsAdminAllKeys,
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";
import { AnswerFields } from "./fields";

type FormFieldDef = FormModel["fields"][number];

function defaultAnswerValue(
  f: FormFieldDef,
): string | boolean | string[] | undefined {
  if (f.type === "checkbox") return false;
  if (f.type === "multiSelect") return [];
  if ((f.type === "select" || f.type === "radio") && f.required)
    return f.data?.options?.[0]?.option ?? "";

  return undefined;
}

export const ResponseForm: React.FC<{
  form: FormModel;
  appId: string;
  response?: FormResponseModel | null;
  onSuccess?: () => void;
  /** When set (e.g. from customer tab), customer selector is locked to this customer. */
  initialCustomerId?: string | null;
  /** When set and creating a new response, redirect here after success instead of responses list. */
  returnUrl?: string;
}> = ({ form, appId, response, onSuccess, initialCustomerId, returnUrl }) => {
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);
  const tAdmin = useI18n("admin");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const isEdit = !!response;
  const customerLocked = initialCustomerId != null && initialCustomerId !== "";

  const formSchema = useMemo(
    () =>
      z.object({
        answers: getFormResponseSchema(form.fields, true),
        customerId: form.requireCustomerId
          ? z
              .string(
                "app_forms_admin.responses.edit.customerRequired" satisfies FormsAdminAllKeys,
              )
              .min(
                1,
                "app_forms_admin.responses.edit.customerRequired" satisfies FormsAdminAllKeys,
              )
          : z.string().nullable().optional(),
      }),
    [form.fields, form.requireCustomerId, t],
  );

  type FormValues = z.infer<typeof formSchema>;

  const defaultValues = useMemo<FormValues>(
    () =>
      response
        ? {
            answers: response.answers.reduce(
              (acc, answer) => {
                acc[answer.name] = answer.value;
                return acc;
              },
              {} as Record<string, unknown>,
            ),
            customerId: response.customerId ?? undefined,
          }
        : {
            answers: form.fields.reduce(
              (acc, f) => {
                acc[f.name] = defaultAnswerValue(f);
                return acc;
              },
              {} as Record<string, unknown>,
            ),
            customerId: initialCustomerId ?? undefined,
          },
    [response, form.fields, initialCustomerId],
  );

  const formHook = useForm<FormValues>({
    defaultValues,
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setSaving(true);
      if (response) {
        await toastPromise(
          updateFormResponse(appId, response._id, {
            answers: data.answers,
            customerId: data.customerId ?? undefined,
          }),
          {
            success: t("responses.edit.toast.saved"),
            error: t("responses.edit.toast.error"),
          },
        );
        onSuccess?.();
      } else {
        await toastPromise(
          createFormResponse(appId, form._id, {
            answers: data.answers,
            customerId: data.customerId ?? null,
          }),
          {
            success: t("responses.new.toast.created"),
            error: t("responses.new.toast.error"),
          },
        );
        onSuccess?.();
      }

      if (returnUrl) {
        router.push(returnUrl);
      } else {
        router.push(`/dashboard/forms/responses?formId=${form._id}`);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbItems = useMemo(
    () => [
      { title: tAdmin("navigation.dashboard"), link: "/dashboard" },
      { title: t("app.displayName"), link: "/dashboard/forms" },
      { title: form.name, link: `/dashboard/forms/edit?id=${form._id}` },
      {
        title: t("app.pages.responses.title"),
        link: "/dashboard/forms/responses",
      },
      {
        title: isEdit ? t("responses.edit.title") : t("responses.new.title"),
        link: isEdit
          ? `/dashboard/forms/responses/edit?id=${response!._id}`
          : "/dashboard/forms/responses/new",
      },
    ],
    [t, tAdmin, isEdit, response],
  );

  return (
    <Form {...formHook}>
      <Breadcrumbs items={breadcrumbItems} />
      <form
        onSubmit={formHook.handleSubmit(onSubmit)}
        className="w-full h-full space-y-8"
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">{form.name}</h2>
        </div>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">
              {t("responses.edit.customerTitle")}
            </h3>
            {form.requireCustomerId && (
              <p className="text-sm text-muted-foreground mt-1">
                {t("responses.edit.customerRequiredNotice")}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <FormField
              control={formHook.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("responses.edit.customerLabel")}
                    {form.requireCustomerId && " *"}
                  </FormLabel>
                  <FormControl className="flex">
                    <CustomerSelector
                      onItemSelect={(id: string | undefined) =>
                        field.onChange(id ?? null)
                      }
                      value={field.value ?? undefined}
                      disabled={saving || customerLocked}
                      allowClear={!customerLocked}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium">
              {t("responses.edit.answersTitle")}
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.fields.map((fieldDef, index) => {
              const AnswerField = AnswerFields[fieldDef.type];
              return (
                <FormField
                  key={fieldDef.name}
                  control={formHook.control}
                  name={`answers.${fieldDef.name}`}
                  render={({ field }) => (
                    <AnswerField
                      field={field}
                      fieldDef={fieldDef}
                      disabled={saving}
                    />
                  )}
                />
              );
            })}
          </CardContent>
        </Card>

        <SaveButton form={formHook} />
      </form>
    </Form>
  );
};
