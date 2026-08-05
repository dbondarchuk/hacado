"use client";

import { useI18n } from "@hacado/i18n/client";
import { Button, Spinner } from "@hacado/ui";
import { cva } from "class-variance-authority";
import { Save } from "lucide-react";
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

export type SaveButtonProps = {
  form: UseFormReturn<any>;
  disabled?: boolean;
  ignoreInvalid?: boolean;
  ignoreDirty?: boolean;
  isLoading?: boolean;
  text?: string;
};

export const SaveButton: React.FC<SaveButtonProps> = ({
  form,
  disabled,
  ignoreInvalid,
  ignoreDirty,
  isLoading: propsIsLoading,
  text,
}) => {
  const t = useI18n("ui");

  const {
    isValid,
    isLoading: isFormLoading,
    errors,
    isDirty,
  } = useFormState({
    control: form.control,
  });

  const classes = cva([
    "flex flex-row gap-2 items-center ml-auto self-end fixed bottom-4 right-4 z-50",
  ]);

  React.useEffect(() => {
    form.trigger();
  }, [form]);

  // if (!isValid && errors) {
  //   return (
  //     <AlertDialog>
  //       <AlertDialogTrigger asChild>
  //         <Button
  //           disabled={disabled || !isDirty}
  //           className={classes()}
  //           type="button"
  //         >
  //           <Save size={30} />
  //         </Button>
  //       </AlertDialogTrigger>
  //       <AlertDialogContent>
  //         <AlertDialogHeader>
  //           <AlertDialogTitle>
  //             {t("saveButton.fixErrorsTitle")}
  //           </AlertDialogTitle>
  //           <AlertDialogDescription>
  //             {Object.entries(errors)
  //               .filter(([_, error]) => !!error?.message)
  //               .map(([key, error]) => (
  //                 <div key={key} className="text-destructive">
  //                   {key}: {JSON.stringify(error?.message || "")}
  //                 </div>
  //               ))}
  //           </AlertDialogDescription>
  //         </AlertDialogHeader>
  //         <AlertDialogFooter>
  //           <AlertDialogCancel>{t("common.close")}</AlertDialogCancel>
  //         </AlertDialogFooter>
  //       </AlertDialogContent>
  //     </AlertDialog>
  //   );
  // }

  const isLoading = propsIsLoading || isFormLoading;

  return (
    <Button
      disabled={
        disabled || isLoading || !(ignoreInvalid || isValid) //||
        // !(ignoreDirty || !isDirty)
      }
      className={classes()}
      type="submit"
    >
      {isLoading ? (
        <Spinner className="w-4 h-4" />
      ) : (
        <Save className="w-4 h-4" />
      )}
      <span>{text || t("saveButton.defaultText")}</span>
    </Button>
  );
};
