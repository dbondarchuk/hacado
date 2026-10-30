"use client";

import { useI18n } from "@hacado/i18n/client";
import { Button, Spinner } from "@hacado/ui";
import { cva } from "class-variance-authority";
import { Check, CircleAlert, Save } from "lucide-react";
import React from "react";
import { UseFormReturn, useFormState } from "react-hook-form";
// import {
//   AlertDialog,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "./alert-dialog";

// export type SaveButtonProps = {
//   form: UseFormReturn<any>;
//   disabled?: boolean;
//   ignoreInvalid?: boolean;
//   ignoreDirty?: boolean;
//   isLoading?: boolean;
//   text?: string;
// };

// export const SaveButton: React.FC<SaveButtonProps> = ({
//   form,
//   disabled,
//   ignoreInvalid,
//   ignoreDirty,
//   isLoading: propsIsLoading,
//   text,
// }) => {
//   const t = useI18n("ui");

//   const {
//     isValid,
//     isLoading: isFormLoading,
//     errors,
//     isDirty,
//   } = useFormState({
//     control: form.control,
//   });

//   const classes = cva([
//     "flex flex-row gap-2 items-center ml-auto self-end fixed bottom-4 right-4 z-50",
//   ]);

//   React.useEffect(() => {
//     form.trigger();
//   }, [form]);

//   // if (!isValid && errors) {
//   //   return (
//   //     <AlertDialog>
//   //       <AlertDialogTrigger asChild>
//   //         <Button
//   //           disabled={disabled || !isDirty}
//   //           className={classes()}
//   //           type="button"
//   //         >
//   //           <Save size={30} />
//   //         </Button>
//   //       </AlertDialogTrigger>
//   //       <AlertDialogContent>
//   //         <AlertDialogHeader>
//   //           <AlertDialogTitle>
//   //             {t("saveButton.fixErrorsTitle")}
//   //           </AlertDialogTitle>
//   //           <AlertDialogDescription>
//   //             {Object.entries(errors)
//   //               .filter(([_, error]) => !!error?.message)
//   //               .map(([key, error]) => (
//   //                 <div key={key} className="text-destructive">
//   //                   {key}: {JSON.stringify(error?.message || "")}
//   //                 </div>
//   //               ))}
//   //           </AlertDialogDescription>
//   //         </AlertDialogHeader>
//   //         <AlertDialogFooter>
//   //           <AlertDialogCancel>{t("common.close")}</AlertDialogCancel>
//   //         </AlertDialogFooter>
//   //       </AlertDialogContent>
//   //     </AlertDialog>
//   //   );
//   // }

//   const isLoading = propsIsLoading || isFormLoading;

//   return (
//     <Button
//       disabled={
//         disabled || isLoading || !(ignoreInvalid || isValid) //||
//         // !(ignoreDirty || !isDirty)
//       }
//       className={classes()}
//       type="submit"
//     >
//       {isLoading ? (
//         <Spinner className="w-4 h-4" />
//       ) : (
//         <Save className="w-4 h-4" />
//       )}
//       <span>{text || t("saveButton.defaultText")}</span>
//     </Button>
//   );
// };

export type SaveButtonProps = {
  form: UseFormReturn<any>;
  disabled?: boolean;
  ignoreInvalid?: boolean;
  /** Keep the bar visible even when nothing changed */
  ignoreDirty?: boolean;
  /** External loading flag, for example a mutation that runs outside handleSubmit */
  isLoading?: boolean;
  /** Save button label */
  text?: string;
  /** Overrides the default discard behavior (form.reset()) */
  onDiscard?: () => void;
  /** Shown in the error state. Falls back to errors.root.serverError.message */
  errorMessage?: string;
  /** How long the green "saved" confirmation stays, in ms */
  savedDuration?: number;
};

const bar = cva(
  "sticky bottom-0 z-50 mx-auto flex max-w-[calc(100vw-2rem)] md:max-w-3xl items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm shadow-lg animate-in fade-in slide-in-from-bottom-4",
  {
    variants: {
      tone: {
        dirty: "border-transparent bg-primary text-primary-foreground",
        saved:
          "border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
        error: "border-destructive/40 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: { tone: "dirty" },
  },
);

// Empty inputs register as "" while defaults stay undefined, which makes
// isDirty true before the user edits. Treat the current values as the baseline.
const acceptCurrentValues = (form: UseFormReturn<any>) => {
  form.reset(form.getValues(), {
    keepValues: true,
    keepErrors: true,
    keepTouched: true,
    keepIsValid: true,
    keepSubmitCount: true,
  });
};

export const SaveButton: React.FC<SaveButtonProps> = ({
  form,
  disabled,
  ignoreInvalid,
  ignoreDirty,
  isLoading: propsIsLoading,
  text,
  onDiscard,
  errorMessage,
  savedDuration = 3000,
}) => {
  const t = useI18n("ui");

  const {
    isValid,
    isLoading: isFormLoading,
    isDirty,
    isSubmitting,
    isSubmitSuccessful,
    errors,
  } = useFormState({ control: form.control });

  const [showSaved, setShowSaved] = React.useState(false);
  const [settled, setSettled] = React.useState(false);
  const wasSaving = React.useRef(false);

  React.useEffect(() => {
    void form.trigger();
    // Field registration and editors update values after this effect. Snapshot
    // once those updates have landed so they are not treated as edits.
    const id = window.setTimeout(() => {
      acceptCurrentValues(form);
      setSettled(true);
    }, 1000);
    return () => window.clearTimeout(id);
  }, [form]);

  const isSaving = !!propsIsLoading || isSubmitting;
  const serverError =
    errorMessage ?? (errors.root?.serverError?.message as string | undefined);
  const hasChanges = !!ignoreDirty || (settled && isDirty);
  const canSave =
    !(disabled || isFormLoading || isSaving) && (ignoreInvalid || isValid);

  React.useEffect(() => {
    if (isSaving) {
      wasSaving.current = true;
      setShowSaved(false);
      return;
    }
    if (!wasSaving.current) return;

    wasSaving.current = false;

    if (isSubmitSuccessful && !serverError) {
      acceptCurrentValues(form);
      setShowSaved(true);
    }
  }, [form, isSaving, isSubmitSuccessful, serverError]);

  // Auto-dismiss the confirmation
  React.useEffect(() => {
    if (!showSaved) return;
    const id = window.setTimeout(() => setShowSaved(false), savedDuration);
    return () => window.clearTimeout(id);
  }, [showSaved, savedDuration]);

  // Editing again replaces the confirmation with the unsaved bar
  React.useEffect(() => {
    if (isDirty) setShowSaved(false);
  }, [isDirty]);

  const state = !settled
    ? "hidden"
    : isSaving
      ? "saving"
      : serverError
        ? "error"
        : showSaved
          ? "saved"
          : hasChanges
            ? "dirty"
            : "hidden";

  if (state === "hidden") return null;

  const label = text || t("saveButton.defaultText");
  const showFieldErrors = !ignoreInvalid && !isValid;

  const revealFieldErrors = () => {
    void form.trigger(undefined, { shouldFocus: true }).then(() => {
      const active = document.activeElement;
      const focused =
        active instanceof HTMLElement && active !== document.body
          ? active
          : null;
      const target =
        focused ?? document.querySelector<HTMLElement>("[aria-invalid='true']");

      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  return (
    <div
      className={bar({
        tone:
          state === "error" ? "error" : state === "saved" ? "saved" : "dirty",
      })}
      role={state === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {state === "saving" && <Spinner className="h-4 w-4 shrink-0" />}
        {state === "saved" && <Check className="h-5 w-5 shrink-0" />}
        {state === "error" && <CircleAlert className="h-5 w-5 shrink-0" />}
        {state === "dirty" && showFieldErrors ? (
          <button
            type="button"
            className="truncate font-medium underline underline-offset-4 hover:opacity-80"
            onClick={revealFieldErrors}
          >
            {t("saveButton.fixErrors")}
          </button>
        ) : (
          <span className="truncate font-medium">
            {state === "saving" && t("saveButton.saving")}
            {state === "saved" && t("saveButton.saved")}
            {state === "error" && (serverError || t("saveButton.failed"))}
            {state === "dirty" && t("saveButton.unsaved")}
          </span>
        )}
      </div>

      {state !== "saved" && (
        <div className="flex shrink-0 gap-2">
          {state !== "error" && (
            <Button
              type="button"
              variant="ghost"
              className="border border-background/30 text-background hover:bg-background/10 hover:text-background"
              disabled={isSaving}
              onClick={onDiscard ?? (() => form.reset())}
            >
              {t("saveButton.discard")}
            </Button>
          )}
          <Button
            type="submit"
            variant={state === "error" ? "outline" : "secondary"}
            disabled={!canSave}
          >
            {state === "saving" ? (
              <Spinner className="h-4 w-4" />
            ) : state === "error" ? null : (
              <Save className="h-4 w-4" />
            )}
            <span>
              {state === "saving"
                ? t("saveButton.saving")
                : state === "error"
                  ? t("saveButton.retry")
                  : label}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
};
