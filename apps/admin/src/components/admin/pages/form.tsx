"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@hacado/api-sdk";
import {
  AppsBlocksEditors,
  AppsBlocksTemplates,
} from "@hacado/app-store/blocks/editors";
import { AppsBlocksReaders } from "@hacado/app-store/blocks/readers";
import { Language, useI18n } from "@hacado/i18n/client";
import { BlockProviderRegistry, PageBuilder } from "@hacado/page-builder";
import { PageReader } from "@hacado/page-builder/reader";
import {
  BrandConfiguration,
  GeneralConfiguration,
  getPageSchemaWithUniqueCheck,
  PageFooter,
  PageHeader,
  PageUpdateModel,
  SocialConfiguration,
} from "@hacado/types";
import {
  Breadcrumbs,
  cn,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  Link,
  toastPromise,
  useDebounceCacheFn,
} from "@hacado/ui";
import { SaveButton, useDemoArguments } from "@hacado/ui-admin";
import { formatArguments, generateSlugPreview } from "@hacado/utils";
import { Globe, Settings as SettingsIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo } from "react";
import { useForm, useFormState } from "react-hook-form";
import * as z from "zod";
import { NavigationGuardDialog, useIsDirty } from "../navigation-guard/dialog";
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
    adminApi.pages.checkUniqueSlug,
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

  const breadcrumbItems = useMemo(
    () => [
      { title: t("assets.dashboard"), link: "/dashboard" },
      { title: t("pages.title"), link: "/dashboard/pages" },
      {
        title: initialData?._id ? title : t("pages.new"),
        link: initialData?._id
          ? `/dashboard/pages/${initialData._id}`
          : "/dashboard/pages/new",
      },
    ],
    [title, initialData?._id, t],
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
          const { _id } = await adminApi.pages.createPage(data);
          onFormSubmit();

          setTimeout(() => {
            router.push(`/dashboard/pages/${_id}`);
          }, 100);
        } else {
          await adminApi.pages.updatePage(initialData._id, data);
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

  const [description, published, publishDate, tags, fullWidth] = form.watch([
    "description",
    "published",
    "publishDate",
    "tags",
    "fullWidth",
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
      const data = await adminApi.pageHeaders.getPageHeader(headerId);
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
      const data = await adminApi.pageFooters.getPageFooter(footerId);
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
    ];
  }, [form, loading, t, hasSettingsErrors]);

  return (
    <Form {...form}>
      <NavigationGuardDialog isDirty={isFormDirty} />
      <div className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex flex-col-reverse md:flex-row md:items-start justify-between gap-4">
            {/* <Heading title={t("pages.edit")} description={`/${slug}`} /> */}
            <div className="flex flex-col gap-2 w-full">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input
                        className="md:text-2xl lg:text-2xl font-bold tracking-tight border-0 w-full"
                        autoFocus
                        h={"lg"}
                        disabled={loading}
                        placeholder={t("pages.form.titlePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <InputGroup>
                        <InputGroupAddon
                          className={cn(
                            InputGroupAddonClasses({
                              variant: "prefix",
                              h: "sm",
                            }),
                            "border-0 pt-2.5",
                          )}
                        >
                          <span className="text-base text-muted-foreground">
                            /
                          </span>
                        </InputGroupAddon>
                        <InputGroupInput>
                          <Input
                            className={cn(
                              "text-base text-muted-foreground",
                              InputGroupInputClasses({ variant: "prefix" }),
                              "pl-0.5 border-0",
                            )}
                            h="sm"
                            disabled={
                              loading || (!isNewPage && slug === "home")
                            }
                            placeholder={t("pages.form.pageSlugPlaceholder")}
                            onChange={(e) => {
                              field.onChange(e);
                              setSlugManuallyChanged(true);
                            }}
                            value={field.value}
                          />
                        </InputGroupInput>
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {initialData?._id && initialData.slug && (
              <Link
                button
                href={`${websiteUrl}/${initialData.slug}?preview=true`}
                variant="default"
                target="_blank"
              >
                <Globe /> {t("pages.viewPage")}
              </Link>
            )}
          </div>
          {/* <Separator /> */}
        </div>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-8"
        >
          <div className="flex flex-col-reverse lg:flex-row gap-4 w-full">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="w-full flex-grow relative">
                  <FormControl>
                    <PageBuilder
                      args={args}
                      value={field.value}
                      onIsValidChange={onPageBuilderValidChange}
                      onChange={field.onChange}
                      header={pageHeader}
                      footer={pageFooter}
                      extraTabs={extraTabs}
                      blockRegistry={blockRegistry}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <SaveButton form={form} ignoreDirty />
        </form>
      </div>
    </Form>
  );
};
