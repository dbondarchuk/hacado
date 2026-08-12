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
  cn,
  DurationInput,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  Switch,
  useCurrencySymbol,
} from "@hacado/ui";
import { MemberSelector } from "@hacado/ui-admin";
import { Trash, X } from "lucide-react";
import React from "react";
import { UseFormReturn, useWatch } from "react-hook-form";

export type MemberOverrideCardProps = {
  item: {
    memberId: string;
    fields_id: string;
  };
  excludeIds?: string[];
  name: string;
  form: UseFormReturn<any>;
  disabled?: boolean;
  remove: () => void;
};

export const MemberOverrideCard: React.FC<MemberOverrideCardProps> = ({
  form,
  name,
  excludeIds,
  disabled,
  remove,
}) => {
  const t = useI18n("admin");
  const currencySymbol = useCurrencySymbol();
  const unavailable = !!useWatch({
    control: form.control,
    name: `${name}.unavailable`,
  });

  return (
    <Card>
      <CardHeader className="justify-between relative flex flex-row border-b px-3 py-3 w-full items-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("services.addons.form.staffOverrides.memberOverrideCard.member")}
        </span>
        <div className="flex flex-row items-start">
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
                    "services.addons.form.staffOverrides.memberOverrideCard.deleteConfirmTitle",
                  )}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t(
                    "services.addons.form.staffOverrides.memberOverrideCard.deleteConfirmDescription",
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t(
                    "services.addons.form.staffOverrides.memberOverrideCard.cancel",
                  )}
                </AlertDialogCancel>
                <AlertDialogAction asChild variant="destructive">
                  <Button onClick={remove}>
                    {t(
                      "services.addons.form.staffOverrides.memberOverrideCard.delete",
                    )}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="py-6 grid grid-cols-1 gap-4 flex-grow w-full">
        <FormField
          control={form.control}
          name={`${name}.memberId`}
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel>
                {t(
                  "services.addons.form.staffOverrides.memberOverrideCard.member",
                )}
              </FormLabel>
              <FormControl>
                <MemberSelector
                  disabled={disabled}
                  excludeIds={excludeIds}
                  className="flex w-full font-normal text-lg"
                  value={field.value}
                  onItemSelect={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${name}.unavailable`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between gap-4 rounded-md border px-3 py-2">
              <div className="space-y-0.5">
                <FormLabel className="text-sm font-medium">
                  {t(
                    "services.addons.form.staffOverrides.memberOverrideCard.unavailable",
                  )}
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  {t(
                    "services.addons.form.staffOverrides.memberOverrideCard.unavailableHint",
                  )}
                </p>
              </div>
              <FormControl>
                <Switch
                  disabled={disabled}
                  checked={!!field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    if (checked) {
                      form.setValue(`${name}.priceOverride`, undefined, {
                        shouldDirty: true,
                      });
                      form.setValue(`${name}.durationOverride`, undefined, {
                        shouldDirty: true,
                      });
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
        {!unavailable ? (
          <div className={cn("grid gap-2 sm:grid-cols-2")}>
            <FormField
              control={form.control}
              name={`${name}.priceOverride`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t(
                      "services.addons.form.staffOverrides.memberOverrideCard.overrides.price",
                    )}
                  </FormLabel>
                  <FormControl>
                    <InputGroup>
                      <InputGroupAddon
                        className={InputGroupAddonClasses({
                          variant: "prefix",
                        })}
                      >
                        {currencySymbol}
                      </InputGroupAddon>
                      <InputGroupInput>
                        <Input
                          disabled={disabled}
                          placeholder="0.00"
                          type="number"
                          className={cn(
                            InputGroupInputClasses({
                              variant: "prefix",
                            }),
                            "rounded-r-none",
                          )}
                          {...field}
                          value={field.value ?? ""}
                        />
                      </InputGroupInput>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-l-none border-l-0"
                        onClick={() => {
                          field.onChange("");
                          field.onBlur();
                        }}
                      >
                        <X className="w-4 h-4 opacity-50" />
                      </Button>
                    </InputGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${name}.durationOverride`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t(
                      "services.addons.form.staffOverrides.memberOverrideCard.overrides.duration",
                    )}
                  </FormLabel>
                  <FormControl>
                    <DurationInput {...field} disabled={disabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
