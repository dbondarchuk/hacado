"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@hacado/api-sdk";
import {
  AppsBlocksEditors,
  AppsBlocksTemplates,
} from "@hacado/app-store/blocks/editors";
import { AppsBlocksReaders } from "@hacado/app-store/blocks/readers";
import { useI18n } from "@hacado/i18n/client";
import { BlockProviderRegistry, PageBuilder } from "@hacado/page-builder";
import {
  getPageFooterSchemaWithUniqueNameCheck,
  PageFooterUpdateModel,
} from "@hacado/types";
import {
  Breadcrumbs,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Heading,
  Input,
  toastPromise,
  useDebounceCacheFn,
} from "@hacado/ui";
import { SaveButton } from "@hacado/ui-admin";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  NavigationGuardDialog,
  useIsDirty,
} from "../../navigation-guard/dialog";

const baseNotAllowedBlocks = [
  "Booking",
  "Popup",
  "ModifyAppointmentForm",
  "BookingConfirmation",
  "Redirect",
];

export const PageFooterForm: React.FC<{
  initialData?: PageFooterUpdateModel & { _id?: string };
  args: Record<string, any>;
  apps?: { appId: string; appName: string }[];
}> = ({ initialData, args, apps }) => {
  const t = useI18n("admin");

  const blockRegistry: BlockProviderRegistry = useMemo(() => {
    return {
      providers:
        apps?.map((app) => ({
          providerName: app.appName,
          priority: 100,
          blocks: Object.fromEntries(
            Object.entries(AppsBlocksEditors[app.appName] || {})
              .filter(([_, value]) => value.allowedInFooter)
              .map(([name, value]) => [
                name,
                {
                  schema: value.schema,
                  editor: {
                    ...value.editor,
                    defaultMetadata: value.defaultMetadata?.(
                      app.appName,
                      app.appId,
                    ),
                  },
                  reader: AppsBlocksReaders[app.appName][name],
                },
              ]),
          ),
          templates: Object.fromEntries(
            Object.entries(
              AppsBlocksTemplates[app.appName]?.(app.appName, app.appId) || {},
            )
              .filter(([_, value]) => value.allowedInFooter)
              .map(([name, value]) => [name, value.configuration]),
          ),
        })) || [],
    };
  }, [apps]);

  const cachedUniqueNameCheck = useDebounceCacheFn(
    adminApi.pageFooters.checkUniquePageFooterName,
    300,
  );

  const formSchema = useMemo(
    () =>
      getPageFooterSchemaWithUniqueNameCheck(
        (name) => cachedUniqueNameCheck(name, initialData?._id),
        "pages.footers.name.unique",
      ),
    [cachedUniqueNameCheck, initialData?._id],
  );

  type PageFormValues = z.infer<typeof formSchema>;

  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const form = useForm<PageFormValues>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: initialData || {},
  });

  const breadcrumbItems = React.useMemo(
    () => [
      { title: t("assets.dashboard"), link: "/dashboard" },
      { title: t("pages.title"), link: "/dashboard/pages" },
      {
        title: t("pages.footers.title"),
        link: "/dashboard/pages/footers",
      },
      {
        title: initialData?._id ? initialData.name : t("pages.footers.new"),
        link: initialData?._id
          ? `/dashboard/pages/footers/${initialData._id}`
          : "/dashboard/pages/footers/new",
      },
    ],
    [initialData?._id, initialData?.name, t],
  );

  const { setError, trigger } = form;
  const onPageBuilderValidChange = React.useCallback(
    (isValid: boolean) =>
      isValid
        ? trigger()
        : setError("content", {
            message: t("templates.form.validation.templateNotValid"),
          }),
    [setError, trigger, t],
  );

  const { isFormDirty, onFormSubmit } = useIsDirty(form);
  const onSubmit = async (data: PageFormValues) => {
    try {
      setLoading(true);

      const fn = async () => {
        if (!initialData?._id) {
          const { _id } = await adminApi.pageFooters.createPageFooter(data);

          onFormSubmit();

          setTimeout(() => {
            router.push(`/dashboard/pages/footers/${_id}`);
          }, 100);
        } else {
          await adminApi.pageFooters.updatePageFooter(initialData._id, data);
          onFormSubmit();

          setTimeout(() => {
            router.refresh();
          }, 100);
        }
      };

      await toastPromise(fn(), {
        success: t("pages.footers.toasts.changesSaved"),
        error: t("common.toasts.error"),
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <NavigationGuardDialog isDirty={isFormDirty} />
      <Breadcrumbs items={breadcrumbItems} />
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-8 relative"
      >
        <Heading
          title={t(
            initialData?._id ? "pages.footers.edit" : "pages.footers.new",
          )}
          description={t(
            initialData?._id
              ? "pages.footers.managePageFooter"
              : "pages.footers.addNewPageFooter",
          )}
        />

        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("pages.footers.form.name")}</FormLabel>
                <FormControl>
                  <Input
                    id="name"
                    disabled={loading}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="w-full flex-grow relative">
                <FormControl>
                  <PageBuilder
                    args={args}
                    notAllowedBlocks={baseNotAllowedBlocks}
                    value={field.value}
                    onIsValidChange={onPageBuilderValidChange}
                    onChange={field.onChange}
                    blockRegistry={blockRegistry}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <SaveButton form={form} disabled={loading} ignoreDirty />
      </form>
    </Form>
  );
};
