"use client";

import { LanguageOptions } from "@/constants/texts";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@timelish/api-sdk";
import { languages, useI18n } from "@timelish/i18n/client";
import { zNonEmptyString } from "@timelish/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Combobox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Input,
  Spinner,
  TagInput,
  Textarea,
  toast,
  toastPromise,
  useClipboard,
} from "@timelish/ui";
import { AssetSelectorInput } from "@timelish/ui-admin";
import { Copy, Plug, Unplug } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { SiteSettingsFormValues } from "../site-settings-schema";

const customDomainSchema = z.object({
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/,
      {
        message: "configuration.brand.domain.invalid",
      },
    )
    .or(z.literal("")),
});

export const BrandTab: React.FC<{
  form: UseFormReturn<SiteSettingsFormValues>;
  loading: boolean;
  customDomain?: string;
  organizationSlug: string;
  websiteUrl: string;
  timeliBaseHost: string;
  timeliBaseUrl: string;
  customDomainARecordIp?: string;
  canConnectCustomDomain?: boolean;
}> = ({
  form,
  loading,
  customDomain,
  organizationSlug,
  websiteUrl,
  timeliBaseHost,
  timeliBaseUrl,
  customDomainARecordIp,
  canConnectCustomDomain = true,
}) => {
  const t = useI18n("admin");
  const { copyToClipboard } = useClipboard();
  const router = useRouter();
  const logo = form.watch("brand.logo");
  const title = form.watch("brand.title");
  const [open, setOpen] = useState(false);
  const [savingDomain, setSavingDomain] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const domainForm = useForm<z.infer<typeof customDomainSchema>>({
    resolver: zodResolver(customDomainSchema),
    defaultValues: {
      domain: customDomain ?? "",
    },
  });

  const watchedDomain = domainForm.watch("domain");

  React.useEffect(() => {
    domainForm.reset({ domain: customDomain ?? "" });
  }, [customDomain, domainForm, open]);

  const getTags = (value: string) => {
    let tags = value.split(/,\s?/g);
    if (tags.length === 1 && !tags[0]) tags = [];
    return tags;
  };

  const onSubmitDomain = async (data: z.infer<typeof customDomainSchema>) => {
    try {
      setSavingDomain(true);
      await toastPromise(
        (async () => {
          return adminApi.organization.setCustomDomain({
            domain: data.domain,
          });
        })(),
        {
          success: t("settings.brand.form.toasts.changesSaved"),
          error: t("settings.brand.form.toasts.requestError"),
        },
      );
      setOpen(false);
      router.refresh();
    } finally {
      setSavingDomain(false);
    }
  };

  const onCopyWebsiteUrl = async () => {
    const ok = await copyToClipboard(websiteUrl);
    if (ok) {
      toast.success(t("settings.brand.form.timeliAddress.websiteUrlCopied"));
    } else {
      toast.error(t("settings.brand.form.timeliAddress.websiteUrlCopyFailed"));
    }
  };

  const onDisconnectDomain = async () => {
    try {
      setDisconnecting(true);
      await toastPromise(
        (async () => {
          return adminApi.organization.deleteCustomDomain();
        })(),
        {
          success: t("settings.brand.form.toasts.changesSaved"),
          error: t("settings.brand.form.toasts.requestError"),
        },
      );
      router.refresh();
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="scroll-mt-24">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-4">
          <CardHeader className="border-b">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("settings.brand.form.visualSectionTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 items-center">
                {logo ? (
                  <img
                    src={logo}
                    alt=""
                    className="h-20 w-20 rounded-lg object-contain border bg-muted/40"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-lg object-contain border bg-muted/40 flex items-center justify-center">
                    <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("settings.brand.form.noLogo")}
                    </span>
                  </div>
                )}
                <p className="text-center text-lg font-semibold">{title}</p>
              </div>
              <FormField
                control={form.control}
                name="brand.logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("settings.brand.form.logo")}{" "}
                      <InfoTooltip>
                        {t("settings.brand.form.logoTooltip")}
                      </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <AssetSelectorInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={loading}
                        placeholder={t("settings.brand.form.logoPlaceholder")}
                        accept="image/*"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8">
          <CardHeader className="border-b">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("settings.brand.form.websiteSectionTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="brand.title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.brand.form.title")}</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder={t("settings.brand.form.titlePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brand.language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("settings.brand.form.language")}</FormLabel>
                    <FormControl>
                      <Combobox
                        values={languages.map((language) => ({
                          label: LanguageOptions[language],
                          value: language,
                        }))}
                        className="w-full"
                        value={field.value}
                        onItemSelect={(val) => {
                          field.onChange(val);
                          field.onBlur();
                        }}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="brand.favicon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("settings.brand.form.favicon")}{" "}
                      <InfoTooltip>
                        {t("settings.brand.form.faviconTooltip")}
                      </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <AssetSelectorInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={loading}
                        placeholder={t(
                          "settings.brand.form.faviconPlaceholder",
                        )}
                        accept="image/*"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("settings.brand.form.seoSectionTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="brand.description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("settings.brand.form.description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      autoResize
                      disabled={loading}
                      placeholder={t(
                        "settings.brand.form.descriptionPlaceholder",
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="brand.keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("settings.brand.form.keywords")}{" "}
                    <InfoTooltip>
                      {t("settings.brand.form.keywordsTooltip")}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <TagInput
                      {...field}
                      value={getTags(field.value)}
                      onChange={(value) =>
                        form.setValue("brand.keywords", value.join(", "))
                      }
                      tagValidator={zNonEmptyString(
                        t("settings.brand.form.keywordValidation"),
                        2,
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("settings.brand.form.timeliAddress.sectionTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="text-sm text-muted-foreground uppercase tracking-wide">
                {t("settings.brand.form.timeliAddress.websiteUrlLabel")}
              </span>
              <div className="flex items-center gap-1 min-w-0">
                <span className="text-base truncate">{websiteUrl}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={onCopyWebsiteUrl}
                  aria-label={t(
                    "settings.brand.form.timeliAddress.copyWebsiteUrlAriaLabel",
                  )}
                >
                  <Copy />
                </Button>
              </div>
            </div>
            {customDomain ? (
              <Button
                type="button"
                variant="destructive"
                onClick={onDisconnectDomain}
                disabled={disconnecting}
              >
                {disconnecting ? <Spinner /> : <Unplug />}{" "}
                {t("settings.brand.form.timeliAddress.disconnectCustomDomain")}
              </Button>
            ) : canConnectCustomDomain ? (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline">
                    <Plug />{" "}
                    {t("settings.brand.form.timeliAddress.connectCustomDomain")}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {t(
                        "settings.brand.form.timeliAddress.connectDialogTitle",
                      )}
                    </DialogTitle>
                    <DialogDescription>
                      {t(
                        "settings.brand.form.timeliAddress.connectDialogDescription",
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 rounded-md border bg-muted/40 px-3 py-3 text-base text-muted-foreground">
                    <p className="font-medium text-foreground">
                      {t(
                        "settings.brand.form.timeliAddress.connectDialogDnsTitle",
                      )}
                    </p>
                    {customDomainARecordIp ? (
                      <p>
                        {t(
                          "settings.brand.form.timeliAddress.connectDialogDnsARecord",
                          { ip: customDomainARecordIp },
                        )}
                      </p>
                    ) : null}
                    <p>
                      {t(
                        "settings.brand.form.timeliAddress.connectDialogDnsCname",
                        {
                          host: timeliBaseHost,
                        },
                      )}
                    </p>
                  </div>
                  <form
                    onSubmit={domainForm.handleSubmit(onSubmitDomain)}
                    className="space-y-6"
                  >
                    <FormField
                      control={domainForm.control}
                      name="domain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("settings.brand.form.timeliAddress.domainLabel")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t(
                                "settings.brand.form.domainPlaceholder",
                              )}
                              disabled={savingDomain}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="secondary" disabled={savingDomain}>
                        {t("common.buttons.close")}
                      </Button>
                    </DialogClose>
                    <Button
                      variant="primary"
                      onClick={domainForm.handleSubmit(onSubmitDomain)}
                      disabled={
                        savingDomain || watchedDomain === (customDomain ?? "")
                      }
                    >
                      {savingDomain ? <Spinner /> : <Plug />}{" "}
                      {t("settings.brand.form.timeliAddress.connectButton")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <p className="text-base text-muted-foreground">
                {t(
                  "settings.brand.form.timeliAddress.customDomainUpgradeRequired",
                )}{" "}
                <Link
                  href="/dashboard/settings/brand?activeTab=general"
                  className="underline font-medium"
                >
                  {t(
                    "settings.brand.form.timeliAddress.customDomainUpgradeLink",
                  )}
                </Link>
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground uppercase tracking-wide">
                {t("settings.brand.form.timeliAddress.organizationSlugLabel")}
              </span>
              <span className="text-base">{organizationSlug}</span>
            </div>
            <Button type="button" variant="outline" disabled>
              {t("settings.brand.form.timeliAddress.updateSlugComingSoon")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
