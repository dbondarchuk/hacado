"use client";

import { cn } from "@hacado/ui/cn";
import {
  FormField,
  FormItem,
  FormLabelWithRequiredIndicator,
} from "@hacado/ui/form";
import { HintInput } from "@hacado/ui/hint-input";
import { Popover, PopoverContent, PopoverTrigger } from "@hacado/ui/popover";
import { Pencil } from "lucide-react";
import React from "react";
import { useFormContext, useFormState } from "react-hook-form";

export function NameIdentityBar({
  loading,
  isNew,
  name = "name",
  label,
  placeholder,
  editLabel,
  layout = "default",
  actions,
  children,
  description,
}: {
  loading: boolean;
  isNew: boolean;
  name?: string;
  label: string;
  placeholder: string;
  editLabel?: string;
  layout?: "default" | "inline";
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const form = useFormContext();
  const value = form.watch(name) as string | undefined;
  const [editorOpen, setEditorOpen] = React.useState(false);
  const { errors, isSubmitted } = useFormState({
    control: form.control,
    name: [name],
  });

  const hasError = Boolean(errors[name as keyof typeof errors]);

  React.useEffect(() => {
    if (layout === "default" && !isNew && hasError) {
      setEditorOpen(true);
    }
  }, [hasError, isNew, layout]);

  const nameField = ({
    autoFocus,
    compact,
  }: {
    autoFocus?: boolean;
    compact?: boolean;
  } = {}) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field, fieldState }) => {
        const showError =
          Boolean(fieldState.error) &&
          (!compact || fieldState.isTouched || isSubmitted);

        return (
          <FormItem className={cn(compact && "gap-1")}>
            {compact ? null : (
              <FormLabelWithRequiredIndicator required>
                {label}
              </FormLabelWithRequiredIndicator>
            )}
            <HintInput
              {...field}
              value={field.value ?? ""}
              h={compact ? "sm" : "md"}
              autoFocus={autoFocus}
              disabled={loading}
              showError={showError}
              aria-label={compact ? label : undefined}
              placeholder={compact ? label : placeholder}
              groupClassName={cn(compact && "focus-within:ring-offset-0")}
              description={description}
            />
          </FormItem>
        );
      }}
    />
  );

  if (layout === "inline") {
    return (
      <div className="flex min-w-0 w-full items-center gap-3">
        <FormField
          control={form.control}
          name={name}
          render={({ field, fieldState }) => {
            const showError =
              Boolean(fieldState.error) &&
              (fieldState.isTouched || isSubmitted || !isNew);

            return (
              <FormItem className="grid min-w-0 max-w-lg flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-0">
                <FormLabelWithRequiredIndicator
                  required
                  className="shrink-0 text-sm font-medium"
                >
                  {label}
                </FormLabelWithRequiredIndicator>
                <HintInput
                  {...field}
                  value={field.value ?? ""}
                  h="sm"
                  autoFocus={isNew}
                  disabled={loading}
                  showError={showError}
                  placeholder={placeholder}
                  groupClassName="min-w-0 w-full focus-within:ring-offset-0"
                  description={description}
                />
              </FormItem>
            );
          }}
        />
        {actions ? <div className="ml-auto shrink-0">{actions}</div> : null}
        {children}
      </div>
    );
  }

  if (isNew) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex min-w-0 items-start gap-2">
          <div className="min-w-0 w-full max-w-md">
            {nameField({ autoFocus: true, compact: true })}
          </div>
          {actions ? <div className="ml-auto shrink-0">{actions}</div> : null}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex min-w-0 items-center gap-2">
        <p
          className={cn(
            "max-w-[40vw] truncate text-base font-medium md:max-w-md",
            !value && "text-muted-foreground",
            hasError && "text-destructive",
          )}
        >
          {value || placeholder}
        </p>
        <Popover open={editorOpen} onOpenChange={setEditorOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={editLabel}
              className={cn(
                "inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-accent",
                hasError && "text-destructive ring-1 ring-destructive",
              )}
            >
              <Pencil aria-hidden className="size-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-96 space-y-3">
            {nameField({ autoFocus: true })}
          </PopoverContent>
        </Popover>
        {actions ? <div className="ml-auto shrink-0">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
