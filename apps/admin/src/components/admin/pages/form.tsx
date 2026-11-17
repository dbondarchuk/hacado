"use client";

import { pageFootersApi } from "@hacado/api-sdk/admin/page-footers";
import { pageHeadersApi } from "@hacado/api-sdk/admin/page-headers";
import { pagesApi } from "@hacado/api-sdk/admin/pages";
import { AppsBlocksEditors } from "@hacado/app-store/blocks/editors";
import { AppsBlocksReaders } from "@hacado/app-store/blocks/readers";
import { AppsBlocksTemplates } from "@hacado/app-store/blocks/templates";
import { Language, useI18n } from "@hacado/i18n/client";
import {
  BlockProviderRegistry,
  PageBuilder,
  type ToolbarButtonInjection,
} from "@hacado/page-builder";
import { PageReader } from "@hacado/page-builder/reader";
import { BrandConfiguration } from "@hacado/types/configuration/brand";
import { GeneralConfiguration } from "@hacado/types/configuration/general";
import { SocialConfiguration } from "@hacado/types/configuration/social";
import {
  getPageSchemaWithUniqueCheck,
  PageFooter,
  PageHeader,
  PageUpdateModel,
} from "@hacado/types/pages";
import { useDemoArguments } from "@hacado/ui-admin/hooks";
import { PageHeader as AdminPageHeader } from "@hacado/ui-admin/page-header";
import { SaveButton } from "@hacado/ui-admin/save-button";
import { Breadcrumbs } from "@hacado/ui/breadcrumbs";
import { cn } from "@hacado/ui/cn";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@hacado/ui/form";
import { useDebounceCacheFn } from "@hacado/ui/hooks";
import { toastPromise } from "@hacado/ui/sonner";
import { ToolbarButton } from "@hacado/ui/toolbar";
import { formatArguments } from "@hacado/utils/format-arguments";
import { generateSlugPreview } from "@hacado/utils/page";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, Settings as SettingsIcon, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { useForm, useFormState } from "react-hook-form";
import * as z from "zod";
import {
  BUILDER_AI_TAB,
  BuilderAIAssistantPanel,
  useBuilderAIStore,
  useBuilderAIToolbarButtons,
} from "../builder-ai";
import { NavigationGuardDialog, useIsDirty } from "../navigation-guard/dialog";
import { PageIdentityBar } from "./page-identity-bar";
import { PageSettingsPanel } from "./page-settings-panel";

// Helper function to generate slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

export const PageForm: React.FC<{
  initialData?: PageUpdateModel & { _id?: string };
  config: {
    general: GeneralConfiguration;
    brand: BrandConfiguration;
    social: SocialConfiguration;
  };
  apps?: { appId: string; appName: string }[];
  websiteUrl: string;
}> = ({ initialData, config, apps, websiteUrl }) => {
  const t = useI18n("admin");

  const cachedUniqueSlugCheck = useDebounceCacheFn(
    pagesApi.checkUniqueSlug,
    300,
  );

  const blockRegistry: BlockProviderRegistry = useMemo(() => {
    return {
      providers:
        apps?.map((app) => ({
          providerName: app.appName,
          priority: 100,
          blocks: Object.fromEntries(
            Object.entries(AppsBlocksEditors[app.appName] || {}).map(
              ([name, value]) => [
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
              ],
            ),
          ),
          templates: Object.fromEntries(
            Object.entries(
              AppsBlocksTemplates[app.appName]?.(app.appName, app.appId) || {},
            ).map(([name, value]) => [name, value.configuration]),
          ),
        })) || [],
    };
  }, [apps]);

  const formSchema = React.useMemo(
    () =>
      getPageSchemaWithUniqueCheck(
        (slug) => cachedUniqueSlugCheck(slug, initialData?._id),
        "page.slug.unique",
      ),
    [cachedUniqueSlugCheck, initialData?._id],
  );

  type PageFormValues = z.infer<typeof formSchema>;
  // Remove old style content
  if (typeof initialData?.content === "string") {
    initialData.content = undefined;
  }

  const [loading, setLoading] = React.useState(false);
  const [slugManuallyChanged, setSlugManuallyChanged] = React.useState(false);
  const router = useRouter();
  const form = useForm<PageFormValues>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: initialData || {
      publishDate: new Date(),
      published: true,
    },
  });

  const slug = form.watch("slug");
  const title = form.watch("title");
  const language = form.watch("language");
  const isNewPage = !initialData?._id;

  const { path, params } = useMemo(() => generateSlugPreview(slug), [slug]);

  // Auto-generate slug when title changes (only for new pages and when slug hasn't been manually changed)
  React.useEffect(() => {
    if (isNewPage && !slugManuallyChanged && title) {
      const generatedSlug = generateSlug(title);
      if (generatedSlug && generatedSlug !== slug) {
        form.setValue("slug", generatedSlug);
        form.trigger("slug");
      }
    }
  }, [title, isNewPage, slugManuallyChanged, slug, form]);

  React.useEffect(() => {
    return useBuilderAIStore
      .getState()
      .registerApplyDocumentSettings((patch, options) => {
        // Freeze before applying title so auto-slug cannot overwrite an AI slug.
        if (patch.slug !== undefined || options?.preserveSlug) {
          setSlugManuallyChanged(true);
        }

        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined) continue;

          form.setValue(key as keyof PageFormValues, value as never, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      });
  }, [form]);

  const breadcrumbItems = useMemo(
    () => [
      { title: t("assets.dashboard"), link: "/dashboard" },
      { title: t("pages.title"), link: "/dashboard/pages" },
      {
        title: initialData?._id ? t("pages.edit") : t("pages.new"),
        link: initialData?._id
          ? `/dashboard/pages/${initialData._id}`
          : "/dashboard/pages/new",
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

  const { isFormDirty, onFormSubmit } = useIsDirty(form);

  const onSubmit = async (data: PageFormValues) => {
    try {
      setLoading(true);

      const fn = async () => {
        if (data.language === ("default" as Language)) {
          data.language = undefined;
        }

        if (!initialData?._id) {
          const { _id } = await pagesApi.createPage(data);
          onFormSubmit();

          setTimeout(() => {
            router.push(`/dashboard/pages/${_id}`);
          }, 100);
        } else {
          await pagesApi.updatePage(initialData._id, data);
          onFormSubmit();

          setTimeout(() => {
            router.refresh();
          }, 100);
        }
      };

      await toastPromise(fn(), {
        success: t("pages.toasts.changesSaved"),
        error: t("common.toasts.error"),
      });
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const [
    description,
    keywords,
    featuredImage,
    published,
    publishDate,
    tags,
    fullWidth,
    doNotCombine,
  ] = form.watch([
    "description",
    "keywords",
    "featuredImage",
    "published",
    "publishDate",
    "tags",
    "fullWidth",
    "doNotCombine",
  ]);

  const demoAppointment = useDemoArguments();

  const args = useMemo(
    () =>
      formatArguments(
        {
          title,
          slug,
          language,
          description,
          published,
          publishDate,
          tags,
          fullWidth,
          path,
          params,
          appointment: demoAppointment,
          social: config.social,
          general: config.general,
          brand: config.brand,
          now: new Date(),
        },
        language || config.brand.language,
        config.general.currency,
        config.general.country,
      ),
    [
      title,
      slug,
      language,
      description,
      published,
      publishDate,
      tags,
      fullWidth,
      demoAppointment,
      config.social,
      config.general,
      config.brand,
      config.brand.language,
      config.general.currency,
    ],
  );

  // Determine if any settings fields have errors
  const nonSettingsFields = ["title", "slug", "content"];

  const { errors } = useFormState({ control: form.control });
  const hasSettingsErrors = Object.keys(errors).some(
    (error) => !nonSettingsFields.includes(error),
  );

  const headerId = form.watch("headerId");
  const footerId = form.watch("footerId");

  const [header, setHeader] = React.useState<PageHeader | null>(null);
  React.useEffect(() => {
    const fetchHeader = async () => {
      if (!headerId) return;

      const data = await pageHeadersApi.getPageHeader(headerId);
      setHeader(data);
    };

    if (headerId) {
      fetchHeader();
    } else {
      setHeader(null);
    }
  }, [headerId]);

  const [footer, setFooter] = React.useState<PageFooter | null>(null);
  React.useEffect(() => {
    const fetchFooter = async () => {
      if (!footerId) return;

      const data = await pageFootersApi.getPageFooter(footerId);
      setFooter(data);
    };

    if (footerId) {
      fetchFooter();
    } else {
      setFooter(null);
    }
  }, [footerId]);

  const pageHeader = useMemo(() => {
    return header
      ? {
          config: header,
          name: config.general.name,
          logo: config.brand.logo,
        }
      : undefined;
  }, [header, config]);

  const pageFooter = useMemo(() => {
    return footer?.content ? (
      <PageReader document={footer.content} args={args} />
    ) : undefined;
  }, [footer, args]);

  const connectedApps = useMemo(
    () =>
      apps?.map((app) => ({
        appId: app.appId,
        appName: app.appName,
      })),
    [apps],
  );

  const documentSettings = useMemo(
    () => ({
      title,
      slug,
      description,
      keywords,
      featuredImage: featuredImage ?? null,
      published,
      publishDate: publishDate
        ? new Date(publishDate).toISOString()
        : undefined,
      language: language ?? null,
      tags,
      doNotCombine,
      headerId: headerId || undefined,
      footerId: footerId || undefined,
      fullWidth,
    }),
    [
      title,
      slug,
      description,
      keywords,
      featuredImage,
      published,
      publishDate,
      language,
      tags,
      doNotCombine,
      headerId,
      footerId,
      fullWidth,
    ],
  );

  const builderAIToolbarButtons = useBuilderAIToolbarButtons({
    builder: "page",
    documentId: initialData?._id,
    apps: connectedApps,
    documentSettings,
  });

  const extraTabs = useMemo(() => {
    return [
      {
        value: "page-settings",
        label: (
          <span className={cn(hasSettingsErrors && "text-destructive")}>
            {t("pages.form.settingsTabLabel")}
          </span>
        ),
        icon: <SettingsIcon size={16} />,
        content: <PageSettingsPanel form={form} loading={loading} />,
      },
      {
        value: BUILDER_AI_TAB,
        label: "AI",
        icon: <Sparkles size={16} />,
        content: <BuilderAIAssistantPanel />,
      },
    ];
  }, [form, loading, t, hasSettingsErrors]);

  const viewPageHref =
    initialData?._id && initialData.slug
      ? `${websiteUrl}/${initialData.slug}?preview=true`
      : undefined;

  const toolbarButtons = useMemo<ToolbarButtonInjection[]>(
    () => [
      ...builderAIToolbarButtons,
      {
        id: "view-page",
        section: "view",
        children: (
          <ToolbarButton
            type="button"
            tooltip={t("pages.viewPage")}
            aria-label={t("pages.viewPage")}
            disabled={!viewPageHref}
            onClick={() => {
              if (!viewPageHref) {
                return;
              }

              window.open(viewPageHref, "_blank", "noopener,noreferrer");
            }}
          >
            <ExternalLink />
          </ToolbarButton>
        ),
      },
    ],
    [t, viewPageHref, builderAIToolbarButtons],
  );

  return (
    <Form {...form}>
      <NavigationGuardDialog isDirty={isFormDirty} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <AdminPageHeader
          className="mb-0 shrink-0"
          text={
            <div className="my-2 w-full min-w-0">
              <PageIdentityBar
                layout="inline"
                loading={loading}
                websiteUrl={websiteUrl}
                isNewPage={isNewPage}
                onSlugManualChange={() => setSlugManuallyChanged(true)}
              />
            </div>
          }
        />
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="relative flex min-h-0 flex-1 flex-col content-normal overflow-hidden">
                <FormControl>
                  <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                    <PageBuilder
                      args={args}
                      value={field.value}
                      onIsValidChange={onPageBuilderValidChange}
                      onChange={field.onChange}
                      header={pageHeader}
                      footer={pageFooter}
                      extraTabs={extraTabs}
                      toolbarButtons={toolbarButtons}
                      blockRegistry={blockRegistry}
                      type="page"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="shrink-0 pt-4">
            <SaveButton form={form} />
          </div>
        </form>
      </div>
    </Form>
  );
};
