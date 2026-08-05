import { useI18n } from "@hacado/i18n/client";
import { AppointmentReschedulePolicyRow } from "@hacado/types";
import {
  Badge,
  BooleanSelect,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Input,
} from "@hacado/ui";
import { NonSortable } from "@hacado/ui-admin";
import {
  ReschedulePolicyCard,
  ReschedulePolicyCardContent,
} from "@hacado/ui-admin-kit";
import React from "react";
import { useFieldArray } from "react-hook-form";
import { TabProps } from "./types";

const RescheduleSection: React.FC<TabProps> = ({ form, disabled }) => {
  const t = useI18n("admin");
  const {
    fields: policies,
    append: appendPolicy,
    remove: removePolicy,
  } = useFieldArray({
    control: form.control,
    name: `cancellationsAndReschedules.reschedules.policies`,
    keyName: "fields_id",
  });

  const ids = React.useMemo(() => policies.map((x) => x.fields_id), [policies]);

  const enabled = !!form.watch(
    `cancellationsAndReschedules.reschedules.enabled`,
  );

  const addNew = () => {
    appendPolicy({
      minutesToAppointment: 0,
      action: "notAllowed",
      note: "",
    } as Partial<AppointmentReschedulePolicyRow> as AppointmentReschedulePolicyRow);
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base font-semibold uppercase tracking-wide text-muted-foreground">
          {t(`cancellationsAndReschedules.reschedulePolicy.title`)}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 py-6">
        <FormField
          control={form.control}
          name={`cancellationsAndReschedules.reschedules.enabled`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("cancellationsAndReschedules.enabled.label")}{" "}
                <InfoTooltip>
                  {t(
                    `cancellationsAndReschedules.reschedulePolicy.enabledTooltip`,
                  )}
                </InfoTooltip>
              </FormLabel>
              <FormControl>
                <BooleanSelect
                  value={field.value ?? false}
                  onValueChange={(val) => {
                    field.onChange(val);
                    field.onBlur();
                  }}
                  trueLabel={t(
                    "cancellationsAndReschedules.enabled.labels.enabled",
                  )}
                  falseLabel={t(
                    "cancellationsAndReschedules.enabled.labels.disabled",
                  )}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {enabled && (
          <>
            <FormField
              control={form.control}
              name="cancellationsAndReschedules.reschedules.maxReschedules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t(
                      "cancellationsAndReschedules.reschedulePolicy.maxReschedules.label",
                    )}
                    <InfoTooltip>
                      {t(
                        "cancellationsAndReschedules.reschedulePolicy.maxReschedules.tooltip",
                      )}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={disabled}
                      type="number"
                      inputMode="decimal"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-sm text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wide">
                    {t(
                      "cancellationsAndReschedules.reschedulePolicy.default.title",
                    )}
                  </span>
                  <span>
                    {t(
                      "cancellationsAndReschedules.reschedulePolicy.default.label",
                    )}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="py-6 grid grid-cols-1 gap-4">
                <ReschedulePolicyCardContent
                  form={form}
                  basePath="cancellationsAndReschedules.reschedules"
                  disabled={disabled}
                  default
                />
              </CardContent>
            </Card>
            <NonSortable
              addButtonText={t(
                "cancellationsAndReschedules.reschedulePolicy.policies.add",
              )}
              className="border-none shadow-none [&>div]:border-none [&>div]:py-2 [&>div]:px-0"
              title={
                <div className="flex flex-row items-center gap-2">
                  <span>
                    {t(
                      "cancellationsAndReschedules.reschedulePolicy.policies.title",
                    )}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-sm normal-case hidden md:block"
                  >
                    {t(
                      "cancellationsAndReschedules.reschedulePolicy.policies.badge",
                    )}
                  </Badge>
                </div>
              }
              ids={ids}
              onAdd={addNew}
            >
              <div className="flex flex-grow flex-col gap-4">
                {policies.map((item, index) => {
                  return (
                    <ReschedulePolicyCard
                      form={form}
                      basePath="cancellationsAndReschedules.reschedules"
                      disabled={disabled}
                      index={index}
                      remove={() => removePolicy(index)}
                      key={item.fields_id}
                    />
                  );
                })}
              </div>
            </NonSortable>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const ReschedulesTab: React.FC<TabProps> = (props) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <RescheduleSection {...props} />
    </div>
  );
};
