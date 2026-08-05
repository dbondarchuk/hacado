"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AppointmentFields } from "@hacado/types";
import React, { useMemo } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  EmailField,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  NameField,
  PhoneField,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  usePrevious,
} from "@hacado/ui";

import {
  waitlistRequestDates,
  waitlistRequestFormSchemaBase,
} from "../../../../models/waitlist";

import { useI18n } from "@hacado/i18n/client";
import { deepEqual } from "@hacado/utils";
import { DateTime as LuxonDateTime } from "luxon";
import { WaitlistDatePicker } from "../../../../components/waitlist-date-picker";
import {
  WaitlistPublicAllKeys,
  WaitlistPublicKeys,
  waitlistPublicNamespace,
  WaitlistPublicNamespace,
} from "../../../../translations/types";
import { useScheduleContext } from "./context";

const formSchema = waitlistRequestFormSchemaBase.and(
  z
    .object({
      asSoonAsPossible: z.literal(false, {
        error:
          "app_waitlist_public.block.asSoonAsPossible.required" satisfies WaitlistPublicAllKeys,
      }),
      dates: waitlistRequestDates,
    })
    .or(
      z.object({
        asSoonAsPossible: z.literal(true, {
          error:
            "app_waitlist_public.block.asSoonAsPossible.required" satisfies WaitlistPublicAllKeys,
        }),
        dates: z.any().optional(),
      }),
    ),
);

export const WaitlistFormCard: React.FC = () => {
  const t = useI18n<WaitlistPublicNamespace, WaitlistPublicKeys>(
    waitlistPublicNamespace,
  );

  const minDate = useMemo(
    () => LuxonDateTime.now().startOf("day").toJSDate(),
    [],
  );

  const {
    fields: propsFields,
    setFields,
    setIsFormValid,
    setWaitlistTimes,
    waitlistTimes,
  } = useScheduleContext();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "all",
    reValidateMode: "onChange",
    defaultValues: {
      ...(propsFields || {
        email: "",
        name: "",
        phone: "",
      }),
      asSoonAsPossible: waitlistTimes.asSoonAsPossible ?? true,
      dates: waitlistTimes.dates || [],
    } as z.infer<typeof formSchema>,
  });

  const values = form.watch();
  const previousValues = usePrevious(values, values);
  React.useEffect(() => {
    if (!deepEqual(values, previousValues)) {
      const { asSoonAsPossible, dates, ...rest } = values;

      setFields(rest as AppointmentFields);
      setWaitlistTimes({ asSoonAsPossible, dates });
    }
  }, [values]);

  const isFormValid = form.formState.isValid;
  React.useEffect(() => {
    setIsFormValid(isFormValid);
  }, [isFormValid]);

  return (
    <Form {...form}>
      <form onSubmit={() => {}} className="space-y-8">
        <h4 className="text-2xl text-center">{t("block.title")}</h4>
        <div className="flex flex-col gap-2">
          <NameField
            control={form.control}
            name="name"
            required={true}
            data={{ label: "common.labels.formName" }}
            disabled={false}
            namespace={undefined}
          />
          <EmailField
            control={form.control}
            name="email"
            required={true}
            data={{ label: "common.labels.formEmail" }}
            disabled={false}
            namespace={undefined}
          />
          <PhoneField
            control={form.control}
            name="phone"
            required={true}
            data={{ label: "common.labels.formPhone" }}
            disabled={false}
            namespace={undefined}
          />
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("block.note.label")}</FormLabel>
                <FormControl>
                  <Textarea
                    autoResize
                    {...field}
                    placeholder={t("block.note.placeholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="asSoonAsPossible"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("block.when.label")}</FormLabel>
                <ToggleGroup
                  type="single"
                  value={field.value ? "true" : "false"}
                  onValueChange={(value) => {
                    field.onChange(value === "true");
                    field.onBlur();
                  }}
                  variant="outline"
                  className="w-full max-sm:flex-col max-sm:gap-1"
                >
                  <ToggleGroupItem
                    value="true"
                    className="text-xs max-sm:w-full max-sm:py-2 max-sm:!rounded-md max-sm:!border"
                  >
                    {t("block.asSoonAsPossible.label")}
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="false"
                    className="text-xs max-sm:w-full max-sm:py-2 max-sm:!rounded-md max-sm:!border"
                  >
                    {t(
                      values.asSoonAsPossible
                        ? "block.dates.label"
                        : "block.dates.label_count",
                      {
                        count: values.dates?.length || 0,
                      },
                    )}
                  </ToggleGroupItem>
                </ToggleGroup>
                <FormMessage />
              </FormItem>
            )}
          />
          {!values.asSoonAsPossible && (
            <FormField
              control={form.control}
              name="dates"
              render={({ field }) => (
                <FormItem>
                  <WaitlistDatePicker
                    value={field.value || []}
                    onChange={(val) => {
                      field.onChange(val);
                      field.onBlur();
                    }}
                    minDate={minDate}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </form>
    </Form>
  );
};
