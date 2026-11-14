"use client";

import { Button } from "@hacado/ui/button";
import { cn } from "@hacado/ui/cn";
import {
  FormField,
  FormItem,
  FormLabelWithRequiredIndicator,
} from "@hacado/ui/form";
import { HintInput } from "@hacado/ui/hint-input";
import { Link } from "@hacado/ui/link";
import { Popover, PopoverContent, PopoverTrigger } from "@hacado/ui/popover";
import { Pencil } from "lucide-react";
import React from "react";
import { useFormContext, useFormState } from "react-hook-form";

export function TitleSlugIdentityBar({
  loading,
  isNew,
  titleName = "title",
  slugName = "slug",
  titleLabel,
  titlePlaceholder,
  titleDescription,
  slugLabel,
  slugPlaceholder,
  slugAutoHint,
  slugChangeWarning,
  editUrlLabel,
  slugPrefix,
  /** Prefix shown on the compact slug pill for existing records. Defaults to "/". */
  slugDisplayPrefix = "/",
  slugLocked = false,
  onSlugManualChange,
  viewHref,
  viewLabel,
  layout = "default",
}: {
  loading: boolean;
  isNew: boolean;
  titleName?: string;
  slugName?: string;
  titleLabel: string;
  titlePlaceholder: string;
  titleDescription?: React.ReactNode;
  slugLabel: string;
  slugPlaceholder: string;
  slugAutoHint?: string;
  slugChangeWarning?: string;
  editUrlLabel: string;
  slugPrefix?: React.ReactNode;
  slugDisplayPrefix?: string;
  slugLocked?: boolean;
  onSlugManualChange?: () => void;
  viewHref?: string;
  viewLabel?: string;
  layout?: "default" | "inline";
}) {
  const form = useFormContext();
  const slug = form.watch(slugName) as string | undefined;
  const title = form.watch(titleName) as string | undefined;
  const [urlEditorOpen, setUrlEditorOpen] = React.useState(false);
  const { errors, isSubmitted } = useFormState({
    control: form.control,
    name: [titleName, slugName],
  });

  const hasIdentityError = Boolean(
    errors[titleName as keyof typeof errors] ||
      errors[slugName as keyof typeof errors],
  );

  React.useEffect(() => {
    if (layout === "default" && !isNew && hasIdentityError) {
      setUrlEditorOpen(true);
    }
  }, [hasIdentityError, isNew, layout]);

  const viewButton =
    viewLabel != null ? (
      viewHref ? (
        <Link
          button
          href={viewHref}
          variant="default"
          size="sm"
          target="_blank"
        >
          {viewLabel}
        </Link>
      ) : (
        <Button type="button" size="sm" variant="outline" disabled>
          {viewLabel}
        </Button>
      )
    ) : null;

  const titleField = ({
    autoFocus,
    compact,
  }: {
    autoFocus?: boolean;
    compact?: boolean;
  } = {}) => (
    <FormField
      control={form.control}
      name={titleName}
      render={({ field, fieldState }) => {
        const showError =
          Boolean(fieldState.error) &&
          (!compact || fieldState.isTouched || isSubmitted);

        return (
          <FormItem className={cn(compact && "gap-1")}>
            {compact ? null : (
              <FormLabelWithRequiredIndicator required>
                {titleLabel}
              </FormLabelWithRequiredIndicator>
            )}
            <HintInput
              {...field}
              value={field.value ?? ""}
              h={compact ? "sm" : "md"}
              autoFocus={autoFocus}
              disabled={loading}
              showError={showError}
              aria-label={compact ? titleLabel : undefined}
              placeholder={compact ? titleLabel : titlePlaceholder}
              description={titleDescription}
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
      name={slugName}
      render={({ field, fieldState }) => {
        const showError =
          Boolean(fieldState.error) &&
          (!compact || fieldState.isTouched || isSubmitted);

        return (
          <FormItem className={cn(compact && "gap-1")}>
            {compact ? null : (
              <FormLabelWithRequiredIndicator required>
                {slugLabel}
              </FormLabelWithRequiredIndicator>
            )}
            <HintInput
              {...field}
              value={field.value ?? ""}
              h={compact ? "sm" : "md"}
              disabled={loading || slugLocked}
              showError={showError}
              aria-label={compact ? slugLabel : undefined}
              placeholder={slugPlaceholder}
              description={
                isNew
                  ? slugAutoHint
                  : slugLocked
                    ? undefined
                    : slugChangeWarning
              }
              groupClassName={cn(compact && "focus-within:ring-offset-0")}
              prefixClassName="min-w-0 max-w-48 shrink overflow-hidden"
              prefix={slugPrefix}
              onChange={(event) => {
                field.onChange(event);
                onSlugManualChange?.();
              }}
            />
          </FormItem>
        );
      }}
    />
  );

  if (layout === "inline") {
    return (
      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <FormField
          control={form.control}
          name={titleName}
          render={({ field, fieldState }) => {
            const showError =
              Boolean(fieldState.error) &&
              (fieldState.isTouched || isSubmitted || !isNew);

            return (
              <FormItem className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-0 sm:max-w-lg">
                <FormLabelWithRequiredIndicator
                  required
                  className="shrink-0 text-sm font-medium"
                >
                  {titleLabel}
                </FormLabelWithRequiredIndicator>
                <HintInput
                  {...field}
                  value={field.value ?? ""}
                  h="sm"
                  autoFocus={isNew}
                  disabled={loading}
                  showError={showError}
                  placeholder={titlePlaceholder}
                  description={titleDescription}
                  groupClassName="min-w-0 w-full focus-within:ring-offset-0"
                />
              </FormItem>
            );
          }}
        />
        <FormField
          control={form.control}
          name={slugName}
          render={({ field, fieldState }) => {
            const showError =
              Boolean(fieldState.error) &&
              (fieldState.isTouched || isSubmitted || !isNew);

            return (
              <FormItem className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-0">
                <FormLabelWithRequiredIndicator
                  required
                  className="shrink-0 text-sm font-medium"
                >
                  {slugLabel}
                </FormLabelWithRequiredIndicator>
                <HintInput
                  {...field}
                  value={field.value ?? ""}
                  h="sm"
                  disabled={loading || slugLocked}
                  showError={showError}
                  placeholder={slugPlaceholder}
                  description={
                    isNew
                      ? slugAutoHint
                      : slugLocked
                        ? undefined
                        : slugChangeWarning
                  }
                  groupClassName="min-w-0 w-full focus-within:ring-offset-0"
                  prefixClassName="min-w-0 max-w-48 shrink overflow-hidden"
                  prefix={slugPrefix}
                  onChange={(event) => {
                    field.onChange(event);
                    onSlugManualChange?.();
                  }}
                />
              </FormItem>
            );
          }}
        />
      </div>
    );
  }

  if (isNew) {
    return (
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          {titleField({ autoFocus: true, compact: true })}
        </div>
        <div className="min-w-0 flex-1">{slugField({ compact: true })}</div>
        {viewButton ? (
          <div className="hidden shrink-0 md:block">{viewButton}</div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <p
        className={cn(
          "max-w-[40vw] truncate text-base font-medium md:max-w-md",
          !title && "text-muted-foreground",
          errors[titleName as keyof typeof errors] && "text-destructive",
        )}
      >
        {title || titlePlaceholder}
      </p>
      <Popover open={urlEditorOpen} onOpenChange={setUrlEditorOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={slugLocked ? titleLabel : editUrlLabel}
            className={cn(
              "inline-flex h-7 max-w-48 shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 text-sm text-muted-foreground hover:bg-accent",
              errors[slugName as keyof typeof errors] &&
                "text-destructive ring-1 ring-destructive",
            )}
          >
            <span className="truncate">
              {slugDisplayPrefix}
              {slug || slugLabel}
            </span>
            <Pencil aria-hidden className="size-3 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-96 space-y-3">
          {titleField({ autoFocus: true })}
          {slugField()}
        </PopoverContent>
      </Popover>
      {viewButton ? (
        <div className="ml-auto hidden shrink-0 md:block">{viewButton}</div>
      ) : null}
    </div>
  );
}
