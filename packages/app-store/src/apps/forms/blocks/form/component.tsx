"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { clientApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import {
  BlockStyle,
  generateClassName,
} from "@timelish/page-builder-base/reader";
import {
  Button,
  cn,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Spinner,
  toast,
  useDebounceCacheFn,
} from "@timelish/ui";
import { CheckCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Resolver, useForm } from "react-hook-form";
import * as z from "zod";
import { FormModel } from "../../models";
import { FormsFieldType } from "../../models/fields";
import { getFormResponseSchema, zPossiblyOptional } from "../../models/utils";
import {
  FormsPublicAllKeys,
  FormsPublicKeys as PublicKeys,
  FormsPublicNamespace as PublicNamespace,
  formsPublicNamespace as publicNamespace,
} from "../../translations/types";
import { FormNotFoundWarning } from "./form-not-found";
import { getPublicFieldComponent } from "./public-form-fields";
import { FormBlockReaderProps, styles } from "./schema";

const CUSTOMER_ID_QUERY_PARAM = "customerId";

type FormBlockComponentProps = {
  form: FormModel | null;
  appId: string;
  style: FormBlockReaderProps["style"];
  blockBase?: { className?: string; id?: string };
  args?: unknown;
  isEditor?: boolean;
};

function defaultAnswerValue(
  f: FormModel["fields"][number],
): string | boolean | string[] | File | null | undefined {
  if (f.type === "checkbox") return false;
  if (f.type === "multiSelect") return [];
  if ((f.type === "select" || f.type === "radio") && f.required)
    return (
      (f.data as { options?: { option: string }[] })?.options?.[0]?.option ?? ""
    );
  return undefined;
}

export const FormBlockComponent = ({
  form,
  appId,
  style,
  blockBase,
  isEditor,
}: FormBlockComponentProps) => {
  const t = useI18n<PublicNamespace, PublicKeys>(publicNamespace);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [customerIdFromUrl, setCustomerIdFromUrl] = useState<string | null>(
    null,
  );

  const requireCustomerId = !!form?.requireCustomerId;

  const checkCustomerIdCorrect = useCallback(
    async (customerId: string) => {
      try {
        if (!customerId) {
          return false;
        }

        const res = await clientApi.apps.callAppApi<
          | {
              customerFound: boolean;
            }
          | {
              success: false;
              error?: string;
              message?: string;
              code?: string;
            }
        >({
          appId,
          path: `check/customer-id`,
          method: "POST",
          body: { customerId },
          parse: "json",
        });

        if (!("customerFound" in res)) {
          toast.error(t("block.formSubmit.error"));
          return false;
        }

        return res.customerFound;
      } catch (error) {
        console.error(error);
        toast.error(t("block.formSubmit.error"));
        return false;
      }
    },
    [appId, t],
  );

  const checkCustomerIdCorrectFn = useDebounceCacheFn(
    checkCustomerIdCorrect,
    300,
  );

  const formSchema = useMemo(
    () =>
      form
        ? z.object({
            customerId: zPossiblyOptional(
              z
                .string(
                  "app_forms_public.block.customerAccess.required" satisfies FormsPublicAllKeys,
                )
                .min(
                  1,
                  "app_forms_public.block.customerAccess.required" satisfies FormsPublicAllKeys,
                )
                .refine(
                  async (customerId) =>
                    await checkCustomerIdCorrectFn(customerId),
                  {
                    message: t("validation.fields.customerAccess.invalid"),
                  },
                ),
              requireCustomerId,
              "app_forms_public.block.customerAccess.required" satisfies FormsPublicAllKeys,
            ),
            answers: getFormResponseSchema(form.fields, false),
          })
        : null,
    [form, requireCustomerId, t],
  );

  type FormValues = z.infer<NonNullable<typeof formSchema>>;

  const defaultValues = useMemo<FormValues>(
    () =>
      form
        ? {
            customerId: form.requireCustomerId ? "" : undefined,
            answers: form.fields.reduce(
              (acc, f) => {
                acc[f.name] = defaultAnswerValue(f);
                return acc;
              },
              {} as Record<string, unknown>,
            ),
          }
        : { answers: {}, customerId: undefined },
    [form, requireCustomerId],
  );

  const formHook = useForm<FormValues>({
    defaultValues,
    resolver: formSchema
      ? (zodResolver(formSchema) as Resolver<FormValues>)
      : undefined,
    mode: "all",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (!requireCustomerId || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get(CUSTOMER_ID_QUERY_PARAM)?.trim();
    if (fromUrl) {
      setCustomerIdFromUrl(fromUrl);
      formHook.setValue("customerId", fromUrl, { shouldValidate: true });
    }
  }, [requireCustomerId]); // eslint-disable-line react-hooks/exhaustive-deps -- only run when requireCustomerId is set

  const onSubmit = async (values: FormValues) => {
    if (!form || !appId || isEditor) return;
    setSubmitStatus("idle");

    const formData = new FormData();
    formData.append("formId", form._id);
    if (typeof window !== "undefined" && window.location?.href) {
      formData.append("_url", window.location.href);
    }

    if (requireCustomerId && values.customerId) {
      formData.append("customerId", values.customerId);
    }

    const data: Record<string, unknown> = {};
    for (const field of form.fields) {
      const value = values.answers[field.name];
      if (value === undefined || value === null) continue;
      if (field.type === "file" && value instanceof File) {
        formData.append(`file_${field.name}`, value);
      }

      data[field.name] = value;
    }

    formData.append("json", JSON.stringify(data));

    try {
      const res = await clientApi.apps.callAppApi<{
        success: boolean;
        error?: string;
        message?: string;
        code?: string;
      }>({
        appId,
        path: "forms",
        method: "POST",
        body: formData,
        parse: "json",
      });

      if (!res.success) {
        const message =
          (res?.error as string) ||
          (res?.message as string) ||
          t("block.formSubmit.error");
        toast.error(message);
        setSubmitStatus("error");
        return;
      }
      formHook.reset(
        customerIdFromUrl && requireCustomerId
          ? { ...defaultValues, customerId: customerIdFromUrl }
          : defaultValues,
      );
      setSubmitStatus("success");
    } catch {
      toast.error(t("block.formSubmit.error"));
      setSubmitStatus("error");
    }
  };

  const className = generateClassName();

  if (!form) {
    return (
      <>
        <BlockStyle
          name={className}
          styleDefinitions={styles}
          styles={style ?? {}}
        />
        <div className={cn(className, blockBase?.className)} id={blockBase?.id}>
          <FormNotFoundWarning />
        </div>
      </>
    );
  }

  if (submitStatus === "success" && !isEditor) {
    return (
      <>
        <BlockStyle
          name={className}
          styleDefinitions={styles}
          styles={style ?? {}}
        />
        <div
          className={cn(
            "forms-form-wrapper forms-form-success",
            className,
            blockBase?.className,
          )}
          id={blockBase?.id}
        >
          <div className="forms-form-success-screen flex flex-col items-center justify-center gap-4 py-8 text-center">
            <CheckCircle
              className="h-14 w-14 text-green-600 dark:text-green-500 shrink-0"
              aria-hidden
            />
            <div className="flex flex-col gap-2">
              <h3 className="forms-form-success-title text-lg font-semibold">
                {t("block.formSubmit.successScreen.title")}
              </h3>
              <p className="forms-form-success-description text-muted-foreground text-sm">
                {t("block.formSubmit.successScreen.description")}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  const customerId = formHook.watch("customerId");

  const isCustomerIdInvalid = !!formHook.formState.errors.customerId;
  const shouldDisableFieldsByCustomerId =
    form.requireCustomerId && (!customerId || isCustomerIdInvalid);
  const isDisabled =
    formHook.formState.isSubmitting || shouldDisableFieldsByCustomerId;

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style ?? {}}
      />
      <div
        className={cn("forms-form-wrapper", className, blockBase?.className)}
        id={blockBase?.id}
      >
        <Form {...formHook}>
          <form
            onSubmit={formHook.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 forms-form"
          >
            {requireCustomerId && (
              <FormField
                control={formHook.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem className="forms-form-item forms-customer-access-field forms-field-customerId">
                    <FormLabel className="forms-label forms-customer-access-label forms-field-customerId-label forms-label-required">
                      {t("block.customerAccess.label")}
                    </FormLabel>
                    {customerIdFromUrl ? (
                      <p className="text-xs text-muted-foreground forms-customer-access-readonly forms-field-customerId-readonly">
                        {t("block.customerAccess.readonlyFromLink")}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground forms-customer-access-description">
                        {t("block.customerAccess.description")}
                      </p>
                    )}
                    <FormControl className="forms-form-control forms-customer-access-control">
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        disabled={formHook.formState.isSubmitting}
                        readOnly={!!customerIdFromUrl}
                        className="read-only:text-muted-foreground forms-text-input forms-customer-access-input forms-field-customerId-input"
                        placeholder={t("block.customerAccess.placeholder")}
                      />
                    </FormControl>
                    <FormMessage className="forms-form-message forms-customer-access-message" />
                  </FormItem>
                )}
              />
            )}
            {form.fields.map((fieldDef) => {
              const FieldComponent = getPublicFieldComponent(
                fieldDef.type as FormsFieldType,
              );
              return (
                <FormField
                  key={fieldDef.name}
                  control={formHook.control}
                  name={`answers.${fieldDef.name}`}
                  render={({ field }) => (
                    <FieldComponent
                      field={field}
                      fieldDef={fieldDef as any}
                      disabled={isDisabled}
                    />
                  )}
                />
              );
            })}
            <Button
              type="submit"
              variant="primary"
              disabled={
                formHook.formState.isSubmitting ||
                !formHook.formState.isValid ||
                isEditor
              }
            >
              {formHook.formState.isSubmitting && (
                <Spinner className="w-4 h-4" />
              )}
              {formHook.formState.isSubmitting
                ? t("block.formSubmit.submitting")
                : t("block.formSubmit.submit")}
            </Button>
          </form>
        </Form>
      </div>
    </>
  );
};
