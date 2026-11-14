"use client";

import { templatesApi } from "@hacado/api-sdk/admin/templates";
import { EmailBuilder } from "@hacado/email-builder";
import { useI18n } from "@hacado/i18n/client";
import { CommunicationChannel } from "@hacado/types/communication";
import {
  getTemplateSchemaWithUniqueCheck,
  Template,
  TemplatesTemplate,
} from "@hacado/types/templates";
import { TextMessageBuilder } from "@hacado/ui-admin-kit/templates";
import { ArgumentsAutocomplete } from "@hacado/ui-admin/arguments-autocomplete";
import { NameIdentityBar } from "@hacado/ui-admin/name-identity-bar";
import { PageHeader } from "@hacado/ui-admin/page-header";
import { SaveButton } from "@hacado/ui-admin/save-button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabelWithRequiredIndicator,
  FormMessage,
} from "@hacado/ui/form";
import { useDebounceCacheFn } from "@hacado/ui/hooks";
import { Link } from "@hacado/ui/link";
import { toastPromise } from "@hacado/ui/sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy } from "lucide-react";
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
    templatesApi.checkUniqueName,
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
          const { _id } = await templatesApi.createTemplate(data);
          onFormSubmit();

          setTimeout(() => {
            router.push(`/dashboard/templates/${_id}`);
          }, 100);
        } else {
          await templatesApi.updateTemplate(initialData._id, data);
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
      <div className="flex flex-1 flex-col gap-4">
        <PageHeader
          className="mb-0"
          text={
            <div className="my-2 w-full min-w-0">
              <NameIdentityBar
                layout="inline"
                loading={loading}
                isNew={!initialData?._id}
                label={t("templates.form.name")}
                placeholder={t("templates.form.namePlaceholder")}
                description={t("templates.form.nameTooltip")}
              />
            </div>
          }
          actions={
            initialData?._id ? (
              <Link
                button
                href={`/dashboard/templates/new/${initialData.type}?cloneFrom=${initialData._id}`}
                variant="default"
                size="sm"
                className="self-center"
                aria-label={t("templates.editPage.clone")}
              >
                <Copy />
                <span className="hidden md:inline">
                  {t("templates.editPage.clone")}
                </span>
              </Link>
            ) : undefined
          }
        />
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="h-full w-full space-y-8"
        >
          <div className="flex flex-col gap-4 w-full h-full">
            {type === "email" && (
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabelWithRequiredIndicator required>
                      {t("templates.form.subject")}
                    </FormLabelWithRequiredIndicator>
                    <FormControl>
                      <ArgumentsAutocomplete
                        args={args}
                        disabled={loading}
                        asInput
                        placeholder={t("templates.form.subjectPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("templates.form.subjectTooltip")}
                    </FormDescription>
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
          <SaveButton form={form} />
        </form>
      </div>
    </Form>
  );
};
