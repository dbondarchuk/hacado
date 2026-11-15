"use client";

import {
  FormField,
  FormItem,
  FormLabelWithRequiredIndicator,
} from "@hacado/ui/form";
import { HintInput } from "@hacado/ui/hint-input";
import React from "react";
import { useFormContext, useFormState } from "react-hook-form";

export function TwoFieldIdentityBar({
  loading,
  isNew,
  primaryName,
  secondaryName,
  primaryLabel,
  primaryPlaceholder,
  primaryDescription,
  secondaryLabel,
  secondaryPlaceholder,
  secondaryDescription,
  secondaryRequired = true,
}: {
  loading: boolean;
  isNew: boolean;
  primaryName: string;
  secondaryName: string;
  primaryLabel: string;
  primaryPlaceholder: string;
  primaryDescription?: React.ReactNode;
  secondaryLabel: string;
  secondaryPlaceholder: string;
  secondaryDescription?: React.ReactNode;
  secondaryRequired?: boolean;
}) {
  const form = useFormContext();
  const { isSubmitted } = useFormState({
    control: form.control,
    name: [primaryName, secondaryName],
  });

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      <FormField
        control={form.control}
        name={primaryName}
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
                {primaryLabel}
              </FormLabelWithRequiredIndicator>
              <HintInput
                {...field}
                value={field.value ?? ""}
                h="sm"
                autoFocus={isNew}
                disabled={loading}
                showError={showError}
                placeholder={primaryPlaceholder}
                description={primaryDescription}
                groupClassName="min-w-0 w-full focus-within:ring-offset-0"
              />
            </FormItem>
          );
        }}
      />
      <FormField
        control={form.control}
        name={secondaryName}
        render={({ field, fieldState }) => {
          const showError =
            Boolean(fieldState.error) &&
            (fieldState.isTouched || isSubmitted || !isNew);

          return (
            <FormItem className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2 gap-y-0">
              <FormLabelWithRequiredIndicator
                required={secondaryRequired}
                className="shrink-0 text-sm font-medium"
              >
                {secondaryLabel}
              </FormLabelWithRequiredIndicator>
              <HintInput
                {...field}
                value={field.value ?? ""}
                h="sm"
                disabled={loading}
                showError={showError}
                placeholder={secondaryPlaceholder}
                description={secondaryDescription}
                groupClassName="min-w-0 w-full focus-within:ring-offset-0"
              />
            </FormItem>
          );
        }}
      />
    </div>
  );
}
