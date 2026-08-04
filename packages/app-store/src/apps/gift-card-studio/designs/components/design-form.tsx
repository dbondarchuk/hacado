"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useI18n } from "@timelish/i18n/client";
import { DatabaseId } from "@timelish/types";
import {
  Breadcrumbs,
  cn,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
  Spinner,
  toastPromise,
  useDebounceCacheFn,
} from "@timelish/ui";
import { SaveButton } from "@timelish/ui-admin";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  checkDesignNameUnique,
  createDesign,
  updateDesign,
} from "../../actions";
import {
  DesignEditor,
  getDefaultDesign,
  getDesignFromStore,
  useIsValidDesign,
} from "../../designer/design-editor";
import { DesignValue } from "../../designer/lib/schema";
import { Design } from "../../designer/lib/types";
import {
  DesignUpdateModel,
  getDesignSchemaWithUniqueCheck,
} from "../../models";
import {
  GiftCardStudioAdminAllKeys,
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";

export const DesignForm: React.FC<{
  initialData?: DesignUpdateModel & Partial<DatabaseId>;
  appId: string;
}> = ({ initialData, appId }) => {
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );
  const tAdmin = useI18n("admin");
  const [loading, setLoading] = useState(false);
  const isValidDesign = useIsValidDesign();
  const router = useRouter();

  const cachedUniqueCheck = useDebounceCacheFn(checkDesignNameUnique, 300);
  const formSchema = useMemo(
    () =>
      getDesignSchemaWithUniqueCheck(
        (name) => cachedUniqueCheck(appId, name, initialData?._id),
        {
          message:
            "app_gift-card-studio_admin.validation.design.name.unique" satisfies GiftCardStudioAdminAllKeys,
          omitDesign: true,
        },
      ),
    [cachedUniqueCheck, appId, initialData?._id],
  );

  type FormValues = z.infer<typeof formSchema>;
  const defaultDesign = useMemo<Design>(
    () => initialData?.design ?? getDefaultDesign(),
    [initialData?.design],
  );
  const form = useForm<FormValues>({
    // Cast needed when zod schema inference differs slightly from DesignUpdateModel (same shape at runtime).
    resolver: zodResolver(formSchema) as never,
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: (initialData ?? {
      name: "",
      design: getDefaultDesign(),
    }) as FormValues,
  });

  const breadcrumbItems = useMemo(
    () => [
      { title: tAdmin("navigation.dashboard"), link: "/dashboard" },
      {
        title: t("app.displayName"),
        link: "/dashboard/gift-card-studio",
      },
      {
        title: initialData?._id ? initialData.name : t("app.pages.new.label"),
        link: initialData?._id
          ? `/dashboard/gift-card-studio/edit?id=${initialData._id}`
          : "/dashboard/gift-card-studio/new",
      },
    ],
    [t, tAdmin, initialData?.name, initialData?._id],
  );

  const onSubmit = async (values: FormValues) => {
    if (!isValidDesign) {
      return;
    }

    try {
      setLoading(true);
      const design = getDesignFromStore() as DesignValue;
      if (initialData?._id) {
        await toastPromise(
          updateDesign(appId, initialData._id, {
            name: values.name,
            design,
          }),
          {
            success: t("designs.form.toasts.updated", { name: values.name }),
            error: t("designs.form.toasts.updatedError"),
          },
        );
        router.refresh();
      } else {
        const result = await toastPromise(
          createDesign(appId, {
            name: values.name,
            design,
          }),
          {
            success: t("designs.form.toasts.created", { name: values.name }),
            error: t("designs.form.toasts.createdError"),
          },
        );
        router.push(`/dashboard/gift-card-studio/edit?id=${result._id}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex flex-col gap-2 w-full">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input
                    className="md:text-xl lg:text-2xl font-bold tracking-tight border-0 w-full px-0"
                    autoFocus
                    h={"lg"}
                    disabled={loading}
                    placeholder={t("designs.form.namePlaceholder")}
                    {...field}
                  />
                </FormControl>
                {initialData?.isArchived && (
                  <p className="text-sm text-muted-foreground">
                    {t("designs.form.archivedNotice")}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div
            className={cn(
              "border border-border rounded-lg overflow-hidden h-[70vh] min-h-[520px] max-h-[900px] relative",
              (loading || initialData?.isArchived) && "pointer-events-none",
            )}
          >
            <DesignEditor
              key={initialData?._id ?? "new"}
              designId={initialData?._id}
              initialDesign={defaultDesign}
              disabled={loading}
            />
            {(loading || initialData?.isArchived) && (
              <div className="absolute inset-0 bg-muted/50 z-[100] flex items-center justify-center pointer-events-none">
                {loading && <Spinner />}
              </div>
            )}
          </div>
        </div>
        <SaveButton form={form} isLoading={loading} disabled={!isValidDesign} />
      </form>
    </Form>
  );
};
