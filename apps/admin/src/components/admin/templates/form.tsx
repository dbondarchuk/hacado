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
import { NameIdentityBar } from "@hacado/ui-admin/name-identity-bar";
import { PageHeader } from "@hacado/ui-admin/page-header";
import { SaveButton } from "@hacado/ui-admin/save-button";
import { TwoFieldIdentityBar } from "@hacado/ui-admin/two-field-identity-bar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@hacado/ui/form";
import { useDebounceCacheFn } from "@hacado/ui/hooks";
import { Link } from "@hacado/ui/link";
import { toastPromise } from "@hacado/ui/sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  BUILDER_AI_TAB,
  BuilderAIAssistantPanel,
  useBuilderAIStore,
  useBuilderAIToolbarButtons,
} from "../builder-ai";
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

  const watchedTemplate = form.watch();
  const documentSettings = useMemo(() => {
    const settings: {
      name?: string;
      subject?: string;
    } = {
      name: watchedTemplate.name,
    };

    if (type === "email" && "subject" in watchedTemplate) {
      settings.subject = String(
        (watchedTemplate as { subject?: string }).subject ?? "",
      );
    }

    return settings;
  }, [type, watchedTemplate]);

  React.useEffect(() => {
    return useBuilderAIStore
      .getState()
      .registerApplyDocumentSettings((patch) => {
        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined) continue;

          form.setValue(key as keyof TemplateFormValues, value as never, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      });
  }, [form]);

  const builderAIToolbarButtons = useBuilderAIToolbarButtons({
    builder: "email",
    documentId: initialData?._id,
    documentSettings,
  });

  const builderAIExtraTabs = useMemo(
    () => [
      {
        value: BUILDER_AI_TAB,
        label: "AI",
        icon: <Sparkles size={16} />,
        content: <BuilderAIAssistantPanel />,
      },
    ],
    [],
  );

  return (
    <Form {...form}>
      <NavigationGuardDialog isDirty={isFormDirty} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PageHeader
          className="mb-0 shrink-0"
          text={
            <div className="my-2 w-full min-w-0">
              {type === "email" ? (
                <TwoFieldIdentityBar
                  loading={loading}
                  isNew={!initialData?._id}
                  primaryName="name"
                  secondaryName="subject"
                  primaryLabel={t("templates.form.name")}
                  primaryPlaceholder={t("templates.form.namePlaceholder")}
                  primaryDescription={t("templates.form.nameTooltip")}
                  secondaryLabel={t("templates.form.subject")}
                  secondaryPlaceholder={t(
                    "templates.form.subjectPlaceholder",
                  )}
                  secondaryDescription={t("templates.form.subjectTooltip")}
                />
              ) : (
                <NameIdentityBar
                  layout="inline"
                  loading={loading}
                  isNew={!initialData?._id}
                  label={t("templates.form.name")}
                  placeholder={t("templates.form.namePlaceholder")}
                  description={t("templates.form.nameTooltip")}
                />
              )}
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
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <>
                  {type === "email" && (
                    <FormItem className="relative flex min-h-0 flex-1 flex-col content-normal overflow-hidden">
                      <FormControl>
                        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                          <EmailBuilder
                            args={args}
                            value={field.value}
                            onIsValidChange={onEmailBuilderValidChange}
                            onChange={field.onChange}
                            toolbarButtons={builderAIToolbarButtons}
                            extraTabs={builderAIExtraTabs}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                  {type === "text-message" && (
                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <TextMessageBuilder args={args} field={field} />
                    </div>
                  )}
                </>
              )}
            />
          </div>
          <div className="shrink-0 pt-4">
            <SaveButton form={form} />
          </div>
        </form>
      </div>
    </Form>
  );
};
