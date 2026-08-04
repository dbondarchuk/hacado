"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi, AdminApiError } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import {
  DndFileInput,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
  toast,
} from "@timelish/ui";
import { SaveButton } from "@timelish/ui-admin";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

export const AssetForm: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const t = useI18n("admin");

  const formSchema = z.object({
    file: z.instanceof(File, { message: "assets.fileRequired" }),
    // filename: z
    //   .string()
    //   .min(3, { message: "assets.fileNameMinLength" })
    //   .regex(
    //     /^[\w,\.\(\)\s-]+\.[A-Za-z0-9]{1,6}$/gi,
    //     "assets.fileNameExtension",
    //   )
    //   .refine(
    //     (filename) => adminApi.assets.checkAssetUniqueFileName(filename),
    //     {
    //       message: "assets.fileNameUnique",
    //     },
    //   ),
    // mimeType: z.string(),
    description: z.string().optional(),
  });

  type FileFormValues = z.infer<typeof formSchema>;

  const form = useForm<FileFormValues>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: {},
  });

  const onSubmit = async (data: FileFormValues) => {
    try {
      setLoading(true);

      await adminApi.assets.createAsset(data.file, {
        description: data.description,
      });

      toast.success(t("assets.toasts.changesSaved"));

      router.push(`/dashboard/assets`);
    } catch (error: unknown) {
      if (error instanceof AdminApiError && error.status === 402) {
        try {
          const body = await error.response.json();
          if (body?.code === "asset_total_size_limit_reached") {
            toast.error(t("assets.toasts.assetTotalSizeLimitReached"));
            return;
          }
        } catch {
          // ignore
        }
      }

      toast.error(t("common.toasts.error"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-8">
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("assets.form.asset")}</FormLabel>
              <FormControl>
                <DndFileInput
                  disabled={loading}
                  value={field.value ? [field.value] : []}
                  onChange={(value) => {
                    field.onChange(value?.[0]);
                    field.onBlur();
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="gap-2 flex flex-col md:grid md:grid-cols-2 md:gap-4">
          {/* <FormField
            control={form.control}
            name="filename"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("assets.form.fileName")}</FormLabel>
                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder={t("assets.form.fileNamePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("assets.form.description")}</FormLabel>
                <FormControl>
                  <Textarea
                    autoResize
                    disabled={loading}
                    placeholder={t("assets.form.descriptionPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <SaveButton form={form} />
      </form>
    </Form>
  );
};
