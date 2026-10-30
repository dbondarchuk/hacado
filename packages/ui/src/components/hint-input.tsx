"use client";

import { AllKeys, I18nFn, useI18n, ValidationKeys } from "@hacado/i18n/client";
import { ErrorMessageWithParams } from "@hacado/types/utils";
import { CircleAlert, Info } from "lucide-react";
import React from "react";
import { cn } from "../utils";
import { FormControl, useFormField } from "./form";
import { Input, InputProps } from "./input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
} from "./input-group";
import {
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
} from "./tooltip-responsive";

function translateFieldError(
  message: string,
  tValidation: I18nFn<"validation">,
  t: I18nFn<undefined>,
) {
  let body = message;
  let params: Record<string, any> | undefined;

  try {
    const parsed = JSON.parse(message) as ErrorMessageWithParams;
    if (parsed && typeof parsed.message === "string") {
      body = parsed.message;
      params = parsed.params;
    }
  } catch {
    body = message;
  }

  if (tValidation.has(body as ValidationKeys)) {
    return tValidation(body as ValidationKeys, params);
  }
  if (t.has(body as AllKeys)) {
    return t(body as AllKeys, params);
  }

  return body;
}

const quietInputClass =
  "border-input aria-[invalid=true]:border-input focus-visible:ring-ring [&[invalid]]:border-input";

const quietGroupClass =
  "border-input has-[[aria-invalid=true]]:border-input has-[[aria-invalid=true]]:focus-within:ring-ring has-[[aria-invalid=true]]:[&_input]:border-input has-[[aria-invalid=true]]:[&>*]:border-input";

export type HintInputProps = Omit<InputProps, "prefix"> & {
  description?: React.ReactNode;
  /** Hide the error icon until the field has been touched or submitted. */
  showError?: boolean;
  prefix?: React.ReactNode;
  prefixClassName?: string;
  groupClassName?: string;
};

export const HintInput = React.forwardRef<HTMLInputElement, HintInputProps>(
  (
    {
      description,
      showError,
      prefix,
      prefixClassName,
      groupClassName,
      className,
      h,
      ...inputProps
    },
    ref,
  ) => {
    const { error, formMessageId, formDescriptionId } = useFormField();
    const tValidation = useI18n("validation");
    const t = useI18n();
    const message = error?.message
      ? translateFieldError(String(error.message), tValidation, t)
      : null;

    const visibleError = (showError ?? Boolean(message)) && Boolean(message);
    const height = h === "lg" || h === "sm" || h === "xs" ? h : "md";
    const hasSuffix = visibleError || Boolean(description);
    const quiet = showError === false && !visibleError;

    const input = (
      <FormControl>
        <Input
          ref={ref}
          h={h}
          className={cn(
            "min-w-0",
            (prefix || hasSuffix) &&
              InputGroupInputClasses({
                variant:
                  prefix && hasSuffix ? "both" : prefix ? "prefix" : "suffix",
              }),
            quiet && quietInputClass,
            className,
          )}
          {...inputProps}
          {...(quiet ? { "aria-invalid": false, invalid: false } : {})}
        />
      </FormControl>
    );

    if (!prefix && !hasSuffix) {
      return input;
    }

    return (
      <InputGroup
        className={cn("min-w-0", quiet && quietGroupClass, groupClassName)}
      >
        {prefix ? (
          <InputGroupAddon
            className={cn(
              InputGroupAddonClasses({ variant: "prefix", h: height }),
              "text-sm text-muted-foreground",
              (height === "sm" || height === "xs") && "py-0",
              visibleError && "border-destructive",
              prefixClassName,
            )}
          >
            {prefix}
          </InputGroupAddon>
        ) : null}
        <InputGroupInput className="min-w-0 w-auto flex-1">
          {input}
        </InputGroupInput>
        {hasSuffix ? (
          <InputGroupAddon
            className={cn(
              InputGroupAddonClasses({ variant: "suffix", h: height }),
              "px-1.5",
              (height === "sm" || height === "xs") && "py-0",
              visibleError
                ? "border-destructive text-destructive"
                : "text-muted-foreground",
            )}
          >
            {description ? (
              <span id={formDescriptionId} className="sr-only">
                {description}
              </span>
            ) : null}
            {visibleError && message ? (
              <span id={formMessageId} className="sr-only">
                {message}
              </span>
            ) : null}
            <TooltipResponsive>
              <TooltipResponsiveTrigger>
                <button
                  type="button"
                  className="inline-flex"
                  aria-label={
                    visibleError && message
                      ? message
                      : typeof description === "string"
                        ? description
                        : undefined
                  }
                >
                  {visibleError ? (
                    <CircleAlert className="size-3.5" />
                  ) : (
                    <Info className="size-3.5" />
                  )}
                </button>
              </TooltipResponsiveTrigger>
              <TooltipResponsiveContent className="max-w-64">
                {visibleError ? message : description}
              </TooltipResponsiveContent>
            </TooltipResponsive>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    );
  },
);

HintInput.displayName = "HintInput";
