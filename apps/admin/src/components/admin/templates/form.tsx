"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@hacado/api-sdk";
import { EmailBuilder } from "@hacado/email-builder";
import { useI18n } from "@hacado/i18n/client";
import {
  CommunicationChannel,
  getTemplateSchemaWithUniqueCheck,
  Template,
  TemplatesTemplate,
} from "@hacado/types";
import {
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
import { ArgumentsAutocomplete, SaveButton } from "@hacado/ui-admin";
import { TextMessageBuilder } from "@hacado/ui-admin-kit";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { NavigationGuardDialog, useIsDirty } from "../navigation-guard/dialog";

export const TemplateForm: React.FC<
  {
    args: any;
  } & (
    | { type: CommunicationChannel; template?: TemplatesTemplate }
    | { initialData: Template }
  )
> = ({ args, ...rest }) => {
  const t = useI18n("admin");
  const initialData = "initialData" in rest ? rest.initialData : undefined;
  const type = initialData?.type || ("type" in rest ? rest.type : "email");
  const template = "template" in rest ? rest.template : undefined;

  const cachedUniqueNameCheck = useDebounceCacheFn(
    adminApi.templates.checkUniqueName,
    300,
  );

  const formSchema = getTemplateSchemaWithUniqueCheck(
    (name) => cachedUniqueNameCheck(name, initialData?._id),
    "templates.nameMustBeUnique",
  );

  type TemplateFormValues = z.infer<typeof formSchema>;

  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: initialData || {
      ...(template || {}),
      type,
    },
  });

  const { isFormDirty, onFormSubmit } = useIsDirty(form);

  const onSubmit = async (data: TemplateFormValues) => {
    try {
      setLoading(true);

      const fn = async () => {
        if (!initialData) {
          const { _id } = await adminApi.templates.createTemplate(data);
          onFormSubmit();

          setTimeout(() => {
            router.push(`/dashboard/templates/${_id}`);
          }, 100);
        } else {
          await adminApi.templates.updateTemplate(initialData._id, data);
          onFormSubmit();

          setTimeout(() => {
            router.refresh();
          }, 100);
        }
      };

      await toastPromise(fn(), {
        success: t("templates.form.toasts.changesSaved"),
        error: t("templates.form.toasts.requestError"),
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const { setError, trigger } = form;
  const onEmailBuilderValidChange = React.useCallback(
    (isValid: boolean) =>
      isValid
        ? trigger()
        : setError("value", {
            message: t("templates.form.validation.templateNotValid"),
          }),
    [setError, trigger, t],
  );

  return (
    <Form {...form}>
      <NavigationGuardDialog isDirty={isFormDirty} />
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full h-full space-y-8"
      >
        <div className="flex flex-col gap-4 w-full h-full">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("templates.form.name")}{" "}
                  <InfoTooltip>{t("templates.form.nameTooltip")}</InfoTooltip>
                </FormLabel>
                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder={t("templates.form.namePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {type === "email" && (
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("templates.form.subject")}
                    <InfoTooltip>
                      {t("templates.form.subjectTooltip")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <ArgumentsAutocomplete
                      args={args}
                      disabled={loading}
                      asInput
                      placeholder={t("templates.form.subjectPlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <>
                {type === "email" && (
                  <FormItem className="w-full flex-grow relative h-full">
                    <FormControl>
                      <EmailBuilder
                        args={args}
                        value={field.value}
                        onIsValidChange={onEmailBuilderValidChange}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                {type === "text-message" && (
                  <TextMessageBuilder args={args} field={field} />
                )}
              </>
            )}
          />
        </div>
        <SaveButton form={form} ignoreDirty />
      </form>
    </Form>
  );
};
