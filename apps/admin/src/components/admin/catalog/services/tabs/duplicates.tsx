import { useI18n } from "@hacado/i18n/client";
import { I18nRichText } from "@hacado/i18n/components";
import { PlateMarkdownEditor } from "@hacado/rte";
import {
  BooleanSelect,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormLabelWithRequiredIndicator,
  FormMessage,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
} from "@hacado/ui";
import { SwitchCardFormItem } from "@hacado/ui-admin";
import React from "react";
import { TabProps } from "./types";

export const DuplicatesTab: React.FC<TabProps> = ({ form, disabled }) => {
  const t = useI18n("admin");

  const duplicateAppointmentCheck = form.watch(
    "duplicateAppointmentCheck.enabled",
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="duplicateAppointmentCheck.enabled"
          render={({ field }) => (
            <SwitchCardFormItem
              label={t(
                "catalog.services.form.duplicateAppointmentCheck.enabled",
              )}
              description={t(
                "catalog.services.form.duplicateAppointmentCheck.enabledTooltip",
              )}
              checked={field.value ?? false}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                field.onBlur();
              }}
            >
              {duplicateAppointmentCheck && (
                <>
                  <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="duplicateAppointmentCheck.doNotAllowScheduling"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t(
                              "catalog.services.form.duplicateAppointmentCheck.doNotAllowScheduling.label",
                            )}
                          </FormLabel>
                          <FormControl>
                            <BooleanSelect
                              value={field.value ?? false}
                              onValueChange={(item) => {
                                field.onChange(item);
                                field.onBlur();
                              }}
                              trueLabel={t(
                                "catalog.services.form.duplicateAppointmentCheck.doNotAllowScheduling.labels.true",
                              )}
                              falseLabel={t(
                                "catalog.services.form.duplicateAppointmentCheck.doNotAllowScheduling.labels.false",
                              )}
                            />
                          </FormControl>
                          <FormDescription>
                            {t(
                              "catalog.services.form.duplicateAppointmentCheck.doNotAllowScheduling.tooltip",
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="duplicateAppointmentCheck.days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabelWithRequiredIndicator required>
                            {t(
                              "catalog.services.form.duplicateAppointmentCheck.days",
                            )}
                          </FormLabelWithRequiredIndicator>
                          <FormControl>
                            <InputGroup>
                              <InputGroupInput>
                                <Input
                                  disabled={disabled}
                                  placeholder="7"
                                  type="number"
                                  className={InputGroupInputClasses({
                                    variant: "suffix",
                                  })}
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    form.trigger(
                                      "duplicateAppointmentCheck.enabled",
                                    );
                                  }}
                                  onBlur={() => {
                                    field.onBlur();
                                    form.trigger(
                                      "duplicateAppointmentCheck.enabled",
                                    );
                                  }}
                                />
                              </InputGroupInput>
                              <InputGroupAddon
                                className={InputGroupAddonClasses({
                                  variant: "suffix",
                                })}
                              >
                                {t(
                                  "catalog.services.form.duplicateAppointmentCheck.daysSuffix",
                                )}
                              </InputGroupAddon>
                            </InputGroup>
                          </FormControl>
                          <FormDescription>
                            {t(
                              "catalog.services.form.duplicateAppointmentCheck.daysTooltip",
                            )}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="duplicateAppointmentCheck.message"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabelWithRequiredIndicator required>
                          {t(
                            "catalog.services.form.duplicateAppointmentCheck.message",
                          )}
                        </FormLabelWithRequiredIndicator>
                        <FormControl>
                          <PlateMarkdownEditor
                            className="bg-background px-4 sm:px-4 pb-24"
                            disabled={disabled}
                            value={field.value}
                            onChange={(v) => {
                              field.onChange(v);
                              field.onBlur();
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          <I18nRichText
                            namespace="admin"
                            text="catalog.services.form.duplicateAppointmentCheck.messageTooltip"
                          />
                          <Collapsible>
                            <CollapsibleTrigger className="mt-2" asChild>
                              <Button
                                variant="link-dashed"
                                size="sm"
                                className="[&[data-state=open]_svg]:rotate-90 text-muted-foreground px-0"
                              >
                                <I18nRichText
                                  namespace="admin"
                                  text="catalog.services.form.duplicateAppointmentCheck.messageExamples.label"
                                  args={{
                                    chevron: () => null,
                                  }}
                                />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <ul className="list-disc list-inside space-y-2 pt-2 pl-4 italic">
                                <li>
                                  {t(
                                    "catalog.services.form.duplicateAppointmentCheck.messageExamples.friendly",
                                  )}
                                </li>
                                <li>
                                  {t(
                                    "catalog.services.form.duplicateAppointmentCheck.messageExamples.neutral",
                                  )}
                                </li>
                                <li>
                                  {t(
                                    "catalog.services.form.duplicateAppointmentCheck.messageExamples.formal",
                                  )}
                                </li>
                              </ul>
                            </CollapsibleContent>
                          </Collapsible>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </SwitchCardFormItem>
          )}
        />
      </div>
    </div>
  );
};
