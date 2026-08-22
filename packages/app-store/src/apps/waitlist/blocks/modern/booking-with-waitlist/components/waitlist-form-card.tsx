import { useI18n } from "@hacado/i18n/client";
import { AppointmentFields } from "@hacado/types";
import {
  Button,
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
import { deepEqual } from "@hacado/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "lucide-react";
import { DateTime } from "luxon";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { WaitlistDatePicker } from "../../../../components/waitlist-date-picker";
import {
  waitlistRequestDates,
  waitlistRequestFormSchemaBase,
} from "../../../../models/waitlist";
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

  const minDate = useMemo(() => DateTime.now().startOf("day").toJSDate(), []);

  const {
    fields: propsFields,
    setFields,
    setIsFormValid,
    setWaitlistTimes,
    waitlistTimes,
    isOnlyWaitlist,
    setFlow,
    setCurrentStep,
    fetchAvailability,
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
  useEffect(() => {
    if (!deepEqual(values, previousValues)) {
      const { asSoonAsPossible, dates, ...rest } = values;

      setFields(rest as AppointmentFields);
      setWaitlistTimes({ asSoonAsPossible, dates });
    }
  }, [values]);

  const isFormValid = form.formState.isValid;
  useEffect(() => {
    setIsFormValid(isFormValid);
  }, [isFormValid]);

  const switchToBooking = async () => {
    setFlow("booking");
    setCurrentStep("calendar");
    await fetchAvailability();
  };

  return (
    <div className="space-y-6 waitlist-form-card card-container">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground waitlist-form-card-title card-title">
          {t("block.waitlist_form.title")}
        </h2>
        <p className="text-sm text-muted-foreground waitlist-form-card-description card-description">
          {t("block.waitlist_form.description")}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={() => {}} className="space-y-2 waitlist-form-card-form">
          <div className="flex flex-col gap-4 waitlist-form-card-form-fields">
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
                    separated
                  >
                    <ToggleGroupItem
                      value="true"
                      className="text-xs py-2 max-sm:w-full max-sm:!rounded-md max-sm:!border"
                    >
                      {t("block.asSoonAsPossible.label")}
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="false"
                      className="text-xs py-2 max-sm:w-full max-sm:!rounded-md"
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

      {/* Back to booking option */}
      {!isOnlyWaitlist && (
        <div className="border-t pt-6">
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-foreground">
                {t("block.waitlist_form.back_to_booking_title")}
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                {t("block.waitlist_form.back_to_booking_description")}
              </p>
              <Button variant="outline" size="sm" onClick={switchToBooking}>
                {t("block.waitlist_form.back_to_booking")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
