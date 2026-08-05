import { AllKeys, TranslationKeys, useI18n } from "@hacado/i18n/client";
import React from "react";
import { cn } from "../../utils";
import { useFormField } from "../form";

export const FormFieldErrorMessage = React.forwardRef<
  HTMLParagraphElement,
  Exclude<React.HTMLAttributes<HTMLParagraphElement>, "children">
>(({ className, ...props }, ref) => {
  const translationT = useI18n("translation");
  const t = useI18n();
  const { error, formMessageId } = useFormField();
  const body = error?.message;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {translationT.has(body as TranslationKeys)
        ? translationT(body as TranslationKeys)
        : t.has(body as AllKeys)
          ? t(body as AllKeys)
          : body}
    </p>
  );
});

FormFieldErrorMessage.displayName = "FormFieldErrorMessage";
