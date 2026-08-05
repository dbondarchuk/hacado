"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { PlateEditor } from "@hacado/rte";
import { DatabaseId } from "@hacado/types";
import {
  BooleanSelect,
  Breadcrumbs,
  Combobox,
  DateTimePicker,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TagInput,
  toastPromise,
  use12HourFormat,
  useDebounceCacheFn,
} from "@hacado/ui";
import {
  AssetPreview,
  AssetSelectorInput,
  SaveButton,
} from "@hacado/ui-admin";
import { fileNameToMimeType } from "@hacado/utils";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  checkBlogPostSlugUnique,
  createBlogPost,
  updateBlogPost,
} from "./actions";
import type { OrganizationAuthorMember } from "./author-actions";
import { getOrganizationAuthorMembers } from "./author-actions";
import {
  BlogPostAuthor,
  blogPostSchema,
  blogPostTagSchema,
  BlogPostUpdateModel,
  getBlogPostSchemaWithUniqueCheck,
} from "./models/blog-post";
import {
  BlogAdminAllKeys,
  BlogAdminKeys,
  BlogAdminNamespace,
  blogAdminNamespace,
} from "./translations/types";

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

export const BlogPostForm: React.FC<{
  initialData?: BlogPostUpdateModel & Partial<DatabaseId>;
  appId: string;
}> = ({ initialData, appId }) => {
  const t = useI18n<BlogAdminNamespace, BlogAdminKeys>(blogAdminNamespace);
  const tAdmin = useI18n("admin");

  const [loading, setLoading] = useState(false);
  const [slugManuallyChanged, setSlugManuallyChanged] = useState(false);
  const [authorMembers, setAuthorMembers] = useState<
    OrganizationAuthorMember[]
  >([]);
  const router = useRouter();

  const cachedUniqueSlugCheck = useDebounceCacheFn(
    checkBlogPostSlugUnique,
    300,
  );

  const formSchema = useMemo(
    () =>
      getBlogPostSchemaWithUniqueCheck(
        (slug) => cachedUniqueSlugCheck(appId, slug, initialData?._id),
        "app_blog_admin.validation.post.slug.unique" satisfies BlogAdminAllKeys,
      ),
    [cachedUniqueSlugCheck, appId, initialData?._id],
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: initialData ?? {
      isPublished: true,
      publicationDate: new Date(),
      tags: [],
      content: [],
      author: { type: "member", memberId: "" },
    },
  });

  React.useEffect(() => {
    let cancelled = false;
    void getOrganizationAuthorMembers().then((members) => {
      if (!cancelled) {
        setAuthorMembers(members);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (initialData?._id) {
      return;
    }

    if (initialData?.author) {
      return;
    }

    let cancelled = false;
    void adminApi.users.getMyUser().then((user) => {
      if (cancelled) {
        return;
      }
      form.setValue(
        "author",
        { type: "member", memberId: user._id },
        { shouldValidate: true },
      );
    });

    return () => {
      cancelled = true;
    };
  }, [initialData, form]);

  React.useEffect(() => {
    if (!initialData || initialData._id) {
      return;
    }

    if (!initialData.author) {
      return;
    }

    form.setValue("author", initialData.author, { shouldValidate: true });
  }, [initialData, form]);

  const slug = form.watch("slug");
  const title = form.watch("title");
  const isNewPost = !initialData?._id;

  const breadcrumbItems = useMemo(
    () => [
      { title: tAdmin("navigation.dashboard"), link: "/dashboard" },
      { title: t("app.displayName"), link: "/dashboard/blog" },
      {
        title: initialData?._id ? initialData.title : t("app.pages.new.label"),
        link: initialData?._id
          ? `/dashboard/blog/${initialData._id}`
          : "/dashboard/blog/new",
      },
    ],
    [initialData?._id, initialData?.title, t, tAdmin],
  );

  // Auto-generate slug when title changes (only when slug hasn't been manually changed)
  // For new posts: always auto-generate if not manually changed
  // For existing posts: only auto-generate if slug was never manually changed
  React.useEffect(() => {
    if (!slugManuallyChanged && title && isNewPost) {
      const generatedSlug = generateSlug(title);
      if (generatedSlug && generatedSlug !== slug) {
        form.setValue("slug", generatedSlug);
        form.trigger("slug");
      }
    }
  }, [title, slugManuallyChanged, slug, form]);

  const onSubmit = async (data: z.infer<typeof blogPostSchema>) => {
    try {
      setLoading(true);

      const fn = async () => {
        if (!initialData?._id) {
          const result = await createBlogPost(appId, data);
          router.push(`/dashboard/blog/edit?id=${result._id}`);
        } else {
          await updateBlogPost(appId, initialData._id, data);
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
            name="title"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input
                    className="md:text-xl lg:text-2xl font-bold tracking-tight border-0 w-full px-0"
                    autoFocus
                    h={"lg"}
                    disabled={loading}
                    placeholder={t("form.titlePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="lg:col-span-2 w-full flex-grow relative h-full">
                <FormLabel>
                  <span>{t("form.content")}</span>{" "}
                  <InfoTooltip>{t("form.contentTooltip")}</InfoTooltip>
                </FormLabel>
                <FormControl>
                  <div className="min-h-[400px] border rounded-md min-w-0">
                    <PlateEditor
                      className="bg-background px-4 sm:px-4 pb-24 min-h-[400px]"
                      disabled={loading}
                      value={field.value || []}
                      onChange={(v) => {
                        field.onChange(v);
                        field.onBlur();
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>{t("form.slug")}</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder={t("form.slugPlaceholder")}
                      onChange={(e) => {
                        field.onChange(e);
                        setSlugManuallyChanged(true);
                      }}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="publicationDate"
              render={({ field }) => {
                const uses12HourFormat = use12HourFormat();
                return (
                  <FormItem>
                    <FormLabel>
                      <span>{t("form.publicationDate")}</span>{" "}
                      <InfoTooltip>
                        {t("form.publicationDateTooltip")}
                      </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <DateTimePicker
                        use12HourFormat={uses12HourFormat}
                        onChange={(e) => {
                          field.onChange(e);
                          field.onBlur();
                        }}
                        value={field.value}
                        className="w-full"
                        classNames={{
                          trigger: "h-8 text-xs",
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>
                    <span>{t("form.isPublished.label")}</span>{" "}
                    <InfoTooltip>{t("form.isPublished.tooltip")}</InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <BooleanSelect
                      disabled={loading}
                      trueLabel={t("form.isPublished.published")}
                      falseLabel={t("form.isPublished.draft")}
                      onValueChange={(value) => {
                        field.onChange(value);
                        field.onBlur();
                      }}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="author"
              render={({ field }) => {
                const authorValue = field.value as BlogPostAuthor | undefined;
                const authorSource = authorValue?.type ?? "member";

                return (
                  <FormItem className="w-full">
                    <FormLabel>
                      <span>{t("form.author.label")}</span>{" "}
                      <InfoTooltip>{t("form.author.tooltip")}</InfoTooltip>
                    </FormLabel>
                    <Select
                      disabled={loading}
                      value={authorSource}
                      onValueChange={(value: "member" | "custom") => {
                        if (value === "member") {
                          field.onChange({
                            type: "member",
                            memberId:
                              authorValue?.type === "member"
                                ? authorValue.memberId
                                : "",
                          });
                        } else {
                          field.onChange({
                            type: "custom",
                            name:
                              authorValue?.type === "custom"
                                ? authorValue.name
                                : "",
                          });
                        }
                        void form.trigger("author");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="member">
                          {t("form.author.source.user")}
                        </SelectItem>
                        <SelectItem value="custom">
                          {t("form.author.source.custom")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {authorSource === "member" ? (
                      <Combobox
                        disabled={loading}
                        value={
                          authorValue?.type === "member"
                            ? authorValue.memberId
                            : ""
                        }
                        onItemSelect={(value) => {
                          field.onChange({ type: "member", memberId: value });
                          field.onBlur();
                          form.trigger("author");
                        }}
                        values={authorMembers.map((member) => ({
                          value: member.id,
                          label: member.name,
                        }))}
                        placeholder={t("form.author.userPlaceholder")}
                      />
                    ) : (
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder={t("form.author.customNamePlaceholder")}
                          value={
                            authorValue?.type === "custom"
                              ? authorValue.name
                              : ""
                          }
                          onChange={(e) => {
                            field.onChange({
                              type: "custom",
                              name: e.target.value,
                            });
                          }}
                          onBlur={() => {
                            field.onBlur();
                            void form.trigger("author");
                          }}
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="featuredImage"
              render={({ field }) => {
                const mimeType = field.value
                  ? fileNameToMimeType(field.value)
                  : undefined;

                return (
                  <FormItem>
                    <FormLabel>
                      <span>{t("form.featuredImage.label")}</span>{" "}
                      <InfoTooltip>
                        {t("form.featuredImage.tooltip")}
                      </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-4">
                        <AssetSelectorInput
                          value={field.value ?? ""}
                          onChange={(value) => {
                            field.onChange(value);
                            field.onBlur();
                          }}
                          disabled={loading}
                          accept="image/*"
                          placeholder={t("form.featuredImage.placeholder")}
                        />
                        {field.value && mimeType?.startsWith("image/") && (
                          <AssetPreview
                            size="md"
                            src={field.value}
                            mimeType={mimeType}
                          />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <span>{t("form.tags")}</span>{" "}
                    <InfoTooltip>{t("form.tagsTooltip")}</InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <TagInput
                      {...field}
                      value={field.value || []}
                      onChange={(e) => {
                        field.onChange(e);
                        field.onBlur();
                      }}
                      h="sm"
                      tagValidator={blogPostTagSchema}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <SaveButton form={form} />
      </form>
    </Form>
  );
};
