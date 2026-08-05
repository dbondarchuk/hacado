import { useI18n } from "@hacado/i18n/client";
import {
  AppointmentWithDepositCancellationPolicyRow,
  AppointmentWithoutDepositCancellationPolicyRow,
} from "@hacado/types";
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
} from "@hacado/ui";
import { NonSortable } from "@hacado/ui-admin";
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
    `cancellationsAndReschedules.cancellations.${withDeposit ? "withDeposit" : "withoutDeposit"}` as const;
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
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base font-semibold uppercase tracking-wide text-muted-foreground">
          {t(
            `cancellationsAndReschedules.cancellationPolicy.${withDeposit ? "withDeposit" : "withoutDeposit"}.title`,
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 py-6">
        <FormField
          control={form.control}
          name={`${baseName}.enabled`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("cancellationsAndReschedules.enabled.label")}{" "}
                <InfoTooltip>
                  {t(
                    `cancellationsAndReschedules.cancellationPolicy.enabledTooltip`,
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
                    `cancellationsAndReschedules.enabled.labels.enabled`,
                  )}
                  falseLabel={t(
                    `cancellationsAndReschedules.enabled.labels.disabled`,
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
              name={`${baseName}.doNotAllowIfRescheduled`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t(
                      "cancellationsAndReschedules.cancellationPolicy.doNotAllowIfRescheduled.label",
                    )}{" "}
                    <InfoTooltip>
                      {t(
                        `cancellationsAndReschedules.cancellationPolicy.doNotAllowIfRescheduled.tooltip`,
                      )}
                    </InfoTooltip>
                  </FormLabel>
                  <FormControl>
                    <BooleanSelect
                      value={field.value ?? false}
                      onValueChange={(val) => {
                        field.onChange(val);
                        if (val) {
                          form.setValue(
                            `${baseName}.policies`,
                            form.getValues(`${baseName}.policies`) ||
                              ([] as any),
                          );
                        }

                        field.onBlur();

                        form.trigger(`${baseName}.policies`);

                        form.trigger(`${baseName}.defaultPolicy.action`);
                      }}
                      disabled={disabled}
                      trueLabel={t(
                        "cancellationsAndReschedules.cancellationPolicy.doNotAllowIfRescheduled.labels.true",
                      )}
                      falseLabel={t(
                        "cancellationsAndReschedules.cancellationPolicy.doNotAllowIfRescheduled.labels.false",
                      )}
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
                  basePath="cancellationsAndReschedules.cancellations"
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
              className="border-none shadow-none [&>div]:border-none [&>div]:py-2 [&>div]:px-0"
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
            >
              <div className="flex flex-grow flex-col gap-4">
                {policies.map((item, index) => {
                  return (
                    <CancellationPolicyCard
                      form={form}
                      basePath="cancellationsAndReschedules.cancellations"
                      disabled={disabled}
                      index={index}
                      remove={() => removePolicy(index)}
                      key={item.fields_id}
                      withDeposit={withDeposit}
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

export const CancellationsTab: React.FC<TabProps> = (props) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <CancellationSection {...props} withDeposit={false} />
      <CancellationSection {...props} withDeposit={true} />
    </div>
  );
};
