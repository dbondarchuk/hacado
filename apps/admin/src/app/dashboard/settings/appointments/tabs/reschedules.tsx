import { useI18n } from "@hacado/i18n/client";
import { AppointmentReschedulePolicyRow } from "@hacado/types";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@hacado/ui";
import { NonSortable, SwitchCardFormItem } from "@hacado/ui-admin";
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
    // <Card>
    //   <CardHeader className="border-b">
    //     <CardTitle className="text-base font-semibold uppercase tracking-wide text-muted-foreground">
    //       {t(`cancellationsAndReschedules.reschedulePolicy.title`)}
    //     </CardTitle>
    //   </CardHeader>
    //   <CardContent className="flex flex-col gap-4 py-6">
    <div className="flex flex-col gap-4">
      <FormField
        control={form.control}
        name={`cancellationsAndReschedules.reschedules.enabled`}
        render={({ field }) => (
          <SwitchCardFormItem
            label={t(
              "cancellationsAndReschedules.reschedulePolicy.enabled.label",
            )}
            description={t(
              "cancellationsAndReschedules.reschedulePolicy.enabled.tooltip",
            )}
            checked={field.value ?? false}
            onCheckedChange={(val) => {
              field.onChange(val);
              field.onBlur();
            }}
            disabled={disabled}
            alwaysItemsStart
          >
            {enabled && (
              <div className="flex flex-col gap-4 pt-4 border-t border-border">
                <FormField
                  control={form.control}
                  name="cancellationsAndReschedules.reschedules.maxReschedules"
                  render={({ field }) => (
                    <FormItem className="pb-4 border-b border-border">
                      <FormLabel>
                        {t(
                          "cancellationsAndReschedules.reschedulePolicy.maxReschedules.label",
                        )}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={disabled}
                          type="number"
                          inputMode="decimal"
                        />
                      </FormControl>
                      <FormDescription>
                        {t(
                          "cancellationsAndReschedules.reschedulePolicy.maxReschedules.tooltip",
                        )}
                      </FormDescription>
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
              </div>
            )}
          </SwitchCardFormItem>
        )}
      />
    </div>
  );
};

export const ReschedulesTab: React.FC<TabProps> = (props) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
      <RescheduleSection {...props} />
    </div>
  );
};
