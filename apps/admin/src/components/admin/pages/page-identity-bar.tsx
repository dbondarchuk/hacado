"use client";

import { useI18n } from "@hacado/i18n/client";
import { Button } from "@hacado/ui/button";
import { cn } from "@hacado/ui/cn";
import {
  FormField,
  FormItem,
  FormLabel,
  FormLabelWithRequiredIndicator,
} from "@hacado/ui/form";
import { HintInput } from "@hacado/ui/hint-input";
import { Link } from "@hacado/ui/link";
import { Popover, PopoverContent, PopoverTrigger } from "@hacado/ui/popover";
import { Pencil } from "lucide-react";
import React from "react";
import { useFormContext, useFormState } from "react-hook-form";

function getWebsiteHost(websiteUrl: string) {
  try {
    return new URL(websiteUrl).host;
  } catch {
    return websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

export function PageIdentityBar({
  loading,
  websiteUrl,
  isNewPage,
  onSlugManualChange,
  viewHref,
}: {
  loading: boolean;
  websiteUrl: string;
  isNewPage: boolean;
  onSlugManualChange: () => void;
  viewHref?: string;
}) {
  const t = useI18n("admin");
  const form = useFormContext();
  const slug = form.watch("slug") as string | undefined;
  const title = form.watch("title") as string | undefined;
  const host = getWebsiteHost(websiteUrl);
  const slugLocked = !isNewPage && slug === "home";
  const [urlEditorOpen, setUrlEditorOpen] = React.useState(false);
  const { errors, isSubmitted } = useFormState({
    control: form.control,
    name: ["title", "slug"],
  });
  const hasIdentityError = Boolean(errors.title || errors.slug);

  React.useEffect(() => {
    if (!isNewPage && hasIdentityError) {
      setUrlEditorOpen(true);
    }
  }, [hasIdentityError, isNewPage]);

  const viewButton = viewHref ? (
    <Link button href={viewHref} variant="default" size="sm" target="_blank">
      {t("pages.viewPage")}
    </Link>
  ) : (
    <Button type="button" size="sm" variant="outline" disabled>
      {t("pages.viewPage")}
    </Button>
  );

  const titleField = ({
    autoFocus,
    compact,
  }: {
    autoFocus?: boolean;
    compact?: boolean;
  } = {}) => (
    <FormField
      control={form.control}
      name="title"
      render={({ field, fieldState }) => {
        const showError =
          Boolean(fieldState.error) &&
          (!compact || fieldState.isTouched || isSubmitted);

        return (
          <FormItem className={cn(compact && "gap-1")}>
            {compact ? null : (
              <FormLabelWithRequiredIndicator required>
                {t("pages.form.pageName")}
              </FormLabelWithRequiredIndicator>
            )}
            <HintInput
              {...field}
              value={field.value ?? ""}
              h={compact ? "sm" : "md"}
              autoFocus={autoFocus}
              disabled={loading}
              showError={showError}
              aria-label={compact ? t("pages.form.pageName") : undefined}
              placeholder={
                compact
                  ? t("pages.form.pageName")
                  : t("pages.form.pageNamePlaceholder")
              }
              groupClassName={cn(compact && "focus-within:ring-offset-0")}
            />
          </FormItem>
        );
      }}
    />
  );

  const slugField = ({ compact }: { compact?: boolean } = {}) => (
    <FormField
      control={form.control}
      name="slug"
      render={({ field, fieldState }) => {
        const showError =
          Boolean(fieldState.error) &&
          (!compact || fieldState.isTouched || isSubmitted);

        return (
          <FormItem className={cn(compact && "gap-1")}>
            {compact ? null : <FormLabel>{t("pages.form.url")}</FormLabel>}
            <HintInput
              {...field}
              value={field.value ?? ""}
              h={compact ? "sm" : "md"}
              disabled={loading || slugLocked}
              showError={showError}
              aria-label={compact ? t("pages.form.url") : undefined}
              placeholder={t("pages.form.slugGeneratedPlaceholder")}
              description={
                isNewPage
                  ? t("pages.form.slugAutoHint")
                  : slugLocked
                    ? undefined
                    : t("pages.form.slugChangeWarning")
              }
              groupClassName={cn(compact && "focus-within:ring-offset-0")}
              prefixClassName="min-w-0 max-w-48 shrink overflow-hidden"
              prefix={
                host ? (
                  <>
                    <span
                      className="hidden min-w-0 truncate md:block"
                      title={`${host}/`}
                    >
                      {host}/
                    </span>
                    <span className="md:hidden">/</span>
                  </>
                ) : undefined
              }
              onChange={(event) => {
                field.onChange(event);
                onSlugManualChange();
              }}
            />
          </FormItem>
        );
      }}
    />
  );

  if (isNewPage) {
    return (
      <div className="flex items-start gap-2">
        <div className="min-w-0 w-[42%] max-w-56 shrink">
          {titleField({ autoFocus: true, compact: true })}
        </div>
        <div className="min-w-0 flex-1">{slugField({ compact: true })}</div>
        <div className="hidden shrink-0 md:block">{viewButton}</div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <p
        className={cn(
          "max-w-[40vw] truncate text-base font-medium md:max-w-md",
          !title && "text-muted-foreground",
          errors.title && "text-destructive",
        )}
      >
        {title || t("pages.form.pageNamePlaceholder")}
      </p>
      <Popover open={urlEditorOpen} onOpenChange={setUrlEditorOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={
              slugLocked ? t("pages.form.pageName") : t("pages.form.editUrl")
            }
            className={cn(
              "inline-flex h-7 max-w-48 shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 text-sm text-muted-foreground hover:bg-accent",
              errors.slug && "text-destructive ring-1 ring-destructive",
            )}
          >
            <span className="truncate">/{slug || t("pages.form.url")}</span>
            <Pencil aria-hidden className="size-3 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-96 space-y-3">
          {titleField({ autoFocus: true })}
          {slugField()}
        </PopoverContent>
      </Popover>
      <div className="ml-auto hidden shrink-0 md:block">{viewButton}</div>
    </div>
  );
}
