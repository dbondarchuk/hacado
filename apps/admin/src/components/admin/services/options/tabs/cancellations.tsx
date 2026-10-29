import { useI18n } from "@hacado/i18n/client";
import {
  AppointmentWithDepositCancellationPolicyRow,
  AppointmentWithoutDepositCancellationPolicyRow,
} from "@hacado/types";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FormField,
} from "@hacado/ui";
import { NonSortable, SwitchCardFormItem } from "@hacado/ui-admin";
import {
  CancellationPolicyCard,
  CancellationPolicyCardContent,
} from "@hacado/ui-admin-kit";
import React from "react";
import { useFieldArray } from "react-hook-form";
import { TabProps } from "./types";

const CancellationSection: React.FC<TabProps & { withDeposit: boolean }> = ({
  form,
  disabled,
  withDeposit,
}) => {
  const t = useI18n("admin");
  const baseName =
    `cancellationPolicy.${withDeposit ? "withDeposit" : "withoutDeposit"}` as const;
  const {
    fields: policies,
    append: appendPolicy,
    remove: removePolicy,
  } = useFieldArray({
    control: form.control,
    name: `${baseName}.policies`,
    keyName: "fields_id",
  });

  const ids = React.useMemo(() => policies.map((x) => x.fields_id), [policies]);

  const type = form.watch(`${baseName}.type`) ?? "inherit";
  const enabled = form.watch(`${baseName}.enabled`) ?? false;

  const addNew = () => {
    appendPolicy({
      minutesToAppointment: 0,
      action: "notAllowed",
      note: "",
    } as Partial<
      | AppointmentWithoutDepositCancellationPolicyRow
      | AppointmentWithDepositCancellationPolicyRow
    > as
      | AppointmentWithoutDepositCancellationPolicyRow
      | AppointmentWithDepositCancellationPolicyRow);
  };

  return (
    // <Card>
    //   <CardHeader className="border-b">
    //     <CardTitle className="text-base font-semibold uppercase tracking-wide text-muted-foreground">
    //       {t(
    //         `services.options.form.cancellationPolicy.${withDeposit ? "withDeposit" : "withoutDeposit"}.title`,
    //       )}
    //     </CardTitle>
    //   </CardHeader>
    //   <CardContent className="flex flex-col gap-4 py-6">
    <div className="flex flex-col gap-4">
      <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {t(
          `services.options.form.cancellationPolicy.${withDeposit ? "withDeposit" : "withoutDeposit"}.title`,
        )}
      </div>
      <FormField
        control={form.control}
        name={`${baseName}.type`}
        render={({ field }) => (
          <SwitchCardFormItem
            label={t(
              "services.options.form.cancellationPolicy.customPolicy.label",
            )}
            description={t(
              "services.options.form.cancellationPolicy.customPolicy.tooltip",
            )}
            checked={field.value === "custom"}
            onCheckedChange={(checked) => {
              field.onChange(checked ? "custom" : "inherit");
              field.onBlur();
            }}
          >
            {type === "custom" && (
              <>
                <FormField
                  control={form.control}
                  name={`${baseName}.enabled`}
                  render={({ field }) => (
                    <SwitchCardFormItem
                      label={t(
                        "cancellationsAndReschedules.cancellationPolicy.enabled.label",
                      )}
                      description={t(
                        "cancellationsAndReschedules.cancellationPolicy.enabled.tooltip",
                      )}
                      checked={field.value ?? false}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        field.onBlur();
                      }}
                      noCard="borderTop"
                      className="pb-0"
                    >
                      {enabled && (
                        <div className="flex flex-col gap-4 pt-4 border-t border-border">
                          <FormField
                            control={form.control}
                            name={`${baseName}.doNotAllowIfRescheduled`}
                            render={({ field }) => (
                              <SwitchCardFormItem
                                label={t(
                                  "cancellationsAndReschedules.cancellationPolicy.doNotAllowIfRescheduled.label",
                                )}
                                description={t(
                                  "cancellationsAndReschedules.cancellationPolicy.doNotAllowIfRescheduled.tooltip",
                                )}
                                checked={!field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(!checked);
                                  field.onBlur();
                                }}
                                noCard
                                className="pb-0"
                              />
                            )}
                          />

                          <Card>
                            <CardHeader className="border-b">
                              <CardTitle className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-sm text-muted-foreground">
                                <span className="font-semibold uppercase tracking-wide">
                                  {t(
                                    "cancellationsAndReschedules.cancellationPolicy.default.title",
                                  )}
                                </span>
                                <span>
                                  {t(
                                    "cancellationsAndReschedules.cancellationPolicy.default.label",
                                  )}
                                </span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="py-6 grid grid-cols-1 gap-4">
                              <CancellationPolicyCardContent
                                basePath="cancellationPolicy"
                                withDeposit={withDeposit}
                                form={form}
                                disabled={disabled}
                                default
                              />
                            </CardContent>
                          </Card>
                          <NonSortable
                            addButtonText={t(
                              "cancellationsAndReschedules.cancellationPolicy.policies.add",
                            )}
                            title={
                              <div className="flex flex-row items-center gap-2">
                                <span>
                                  {t(
                                    "cancellationsAndReschedules.cancellationPolicy.policies.title",
                                  )}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="text-sm normal-case hidden md:block"
                                >
                                  {t(
                                    "cancellationsAndReschedules.cancellationPolicy.policies.badge",
                                  )}
                                </Badge>
                              </div>
                            }
                            ids={ids}
                            onAdd={addNew}
                            className="border-none shadow-none [&>div]:border-none [&>div]:py-2 [&>div]:px-0"
                          >
                            <div className="flex flex-grow flex-col gap-4">
                              {policies.map((item, index) => {
                                return (
                                  <CancellationPolicyCard
                                    form={form}
                                    disabled={disabled}
                                    index={index}
                                    remove={() => removePolicy(index)}
                                    key={item.fields_id}
                                    withDeposit={withDeposit}
                                    basePath="cancellationPolicy"
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
              </>
            )}
          </SwitchCardFormItem>
        )}
      />
    </div>
  );
};

export const CancellationsTab: React.FC<TabProps> = (props) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <CancellationSection {...props} withDeposit={false} />
      <CancellationSection {...props} withDeposit={true} />
    </div>
  );
};
