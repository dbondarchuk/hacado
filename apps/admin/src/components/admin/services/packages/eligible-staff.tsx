"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
} from "@hacado/ui";
import { MemberSelector, NonSortable } from "@hacado/ui-admin";
import { Trash } from "lucide-react";
import React from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";

export const EligibleStaff: React.FC<{
  form: UseFormReturn<any>;
  disabled?: boolean;
}> = ({ form, disabled }) => {
  const t = useI18n("admin");
  const {
    fields: staffFields,
    append: appendStaff,
    remove: removeStaff,
  } = useFieldArray({
    control: form.control,
    name: "eligibleStaff",
    keyName: "fields_id",
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {t("services.packages.form.eligibleStaff.hint")}
      </p>
      <NonSortable
        title={
          <>
            {t("services.packages.form.eligibleStaff.title")}{" "}
            <InfoTooltip>
              {t("services.packages.form.eligibleStaff.tooltip")}
            </InfoTooltip>
          </>
        }
        ids={staffFields.map((item) => item.fields_id)}
        onAdd={() => appendStaff({ memberId: "" })}
        disabled={disabled}
        addButtonText={t("services.packages.form.eligibleStaff.add")}
      >
        <div className="flex flex-grow flex-col gap-4">
          {staffFields.map((item, index) => (
            <Card key={item.fields_id}>
              <CardHeader className="justify-between relative flex flex-row border-b px-3 py-3 w-full items-center">
                <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("services.packages.form.eligibleStaff.member")}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      disabled={disabled}
                      variant="ghost-destructive"
                      size="icon"
                      type="button"
                    >
                      <Trash />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t(
                          "services.packages.form.eligibleStaff.deleteConfirmTitle",
                        )}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t(
                          "services.packages.form.eligibleStaff.deleteConfirmDescription",
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("services.packages.form.eligibleStaff.cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction asChild variant="destructive">
                        <Button onClick={() => removeStaff(index)}>
                          {t("services.packages.form.eligibleStaff.delete")}
                        </Button>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardHeader>
              <CardContent className="py-6 flex-grow w-full">
                <FormField
                  control={form.control}
                  name={`eligibleStaff.${index}.memberId`}
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>
                        {t("services.packages.form.eligibleStaff.member")}
                      </FormLabel>
                      <FormControl>
                        <MemberSelector
                          disabled={disabled}
                          excludeIds={form
                            .getValues("eligibleStaff")
                            ?.map((staff: { memberId?: string }, i: number) =>
                              i === index ? undefined : staff.memberId,
                            )
                            .filter(Boolean)}
                          className="flex w-full font-normal text-lg"
                          value={field.value}
                          onItemSelect={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </NonSortable>
    </div>
  );
};
