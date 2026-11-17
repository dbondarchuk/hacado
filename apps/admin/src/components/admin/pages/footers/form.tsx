"use client";

import { pageFootersApi } from "@hacado/api-sdk/admin/page-footers";
import { AppsBlocksEditors } from "@hacado/app-store/blocks/editors";
import { AppsBlocksReaders } from "@hacado/app-store/blocks/readers";
import { AppsBlocksTemplates } from "@hacado/app-store/blocks/templates";
import { useI18n } from "@hacado/i18n/client";
import { BlockProviderRegistry, PageBuilder } from "@hacado/page-builder";
import {
  getPageFooterSchemaWithUniqueNameCheck,
  PageFooterUpdateModel,
} from "@hacado/types/pages";
import { NameIdentityBar } from "@hacado/ui-admin/name-identity-bar";
import { PageHeader } from "@hacado/ui-admin/page-header";
import { SaveButton } from "@hacado/ui-admin/save-button";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@hacado/ui/form";
import { useDebounceCacheFn } from "@hacado/ui/hooks";
import { toastPromise } from "@hacado/ui/sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  BUILDER_AI_TAB,
  BuilderAIAssistantPanel,
  useBuilderAIHostLifecycle,
  useBuilderAIStore,
  useBuilderAIToolbarButtons,
} from "../../builder-ai";
import {
  NavigationGuardDialog,
  useIsDirty,
} from "../../navigation-guard/dialog";

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
    pageFootersApi.checkUniquePageFooterName,
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
  const pathname = usePathname();
  const documentId = initialData?._id;
  const form = useForm<PageFormValues>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: initialData || {},
  });

  useBuilderAIHostLifecycle(documentId);

  React.useEffect(() => {
    form.reset(initialData || {});
  }, [pathname, documentId, form, initialData]);

  const breadcrumbItems = React.useMemo(
    () => [
      { title: t("assets.dashboard"), link: "/dashboard" },
      { title: t("pages.title"), link: "/dashboard/pages" },
      {
        title: t("pages.footers.title"),
        link: "/dashboard/pages/footers",
      },
      {
        title: initialData?._id
          ? t("pages.footers.edit")
          : t("pages.footers.new"),
        link: initialData?._id
          ? `/dashboard/pages/footers/${initialData._id}`
          : "/dashboard/pages/footers/new",
      },
    ],
    [initialData?._id, t],
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

  const connectedApps = useMemo(
    () =>
      apps?.map((app) => ({
        appId: app.appId,
        appName: app.appName,
      })),
    [apps],
  );

  const footerName = form.watch("name");
  const documentSettings = useMemo(
    () => ({
      name: footerName,
    }),
    [footerName],
  );

  React.useEffect(() => {
    return useBuilderAIStore
      .getState()
      .registerApplyDocumentSettings((patch) => {
        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined) continue;

          form.setValue(key as keyof PageFormValues, value as never, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      });
  }, [form]);

  const builderAIToolbarButtons = useBuilderAIToolbarButtons({
    builder: "footer",
    documentId: initialData?._id,
    apps: connectedApps,
    documentSettings,
  });

  const extraTabs = useMemo(
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

  const { isFormDirty, onFormSubmit } = useIsDirty(form);
  const onSubmit = async (data: PageFormValues) => {
    try {
      setLoading(true);

      const fn = async () => {
        if (!initialData?._id) {
          const { _id } = await pageFootersApi.createPageFooter(data);

          onFormSubmit();

          setTimeout(() => {
            router.push(`/dashboard/pages/footers/${_id}`);
          }, 100);
        } else {
          await pageFootersApi.updatePageFooter(initialData._id, data);
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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <PageHeader
          className="mb-0 shrink-0"
          text={
            <div className="my-2 w-full min-w-0">
              <NameIdentityBar
                layout="inline"
                loading={loading}
                isNew={!initialData?._id}
                label={t("pages.footers.form.name")}
                placeholder={t("pages.footers.form.namePlaceholder")}
                description={t("pages.footers.form.nameTooltip")}
              />
            </div>
          }
        />
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="relative flex min-h-0 flex-1 flex-col content-normal overflow-hidden">
                <FormControl>
                  <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                    <PageBuilder
                      key={`${pathname}:${documentId ?? "new"}`}
                      args={args}
                      type="footer"
                      value={field.value}
                      onIsValidChange={onPageBuilderValidChange}
                      onChange={field.onChange}
                      blockRegistry={blockRegistry}
                      toolbarButtons={builderAIToolbarButtons}
                      extraTabs={extraTabs}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="shrink-0 pt-4">
            <SaveButton form={form} disabled={loading} />
          </div>
        </form>
      </div>
    </Form>
  );
};
