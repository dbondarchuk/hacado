import { useI18n } from "@timelish/i18n/client";
import { I18nRichText } from "@timelish/i18n/components";
import { PlateMarkdownEditor } from "@timelish/rte";
import {
  BooleanSelect,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
} from "@timelish/ui";
import { ChevronRight } from "lucide-react";
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
            <FormItem>
              <FormLabel>
                {t("services.options.form.duplicateAppointmentCheck.enabled")}{" "}
                <InfoTooltip>
                  {t(
                    "services.options.form.duplicateAppointmentCheck.enabledTooltip",
                  )}
                </InfoTooltip>
              </FormLabel>
              <FormControl>
                <BooleanSelect
                  value={field.value ?? false}
                  onValueChange={(item) => {
                    field.onChange(item);
                    field.onBlur();
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                        "services.options.form.duplicateAppointmentCheck.doNotAllowScheduling.label",
                      )}{" "}
                      <InfoTooltip>
                        {t(
                          "services.options.form.duplicateAppointmentCheck.doNotAllowScheduling.tooltip",
                        )}
                      </InfoTooltip>
                    </FormLabel>
                    <FormControl>
                      <BooleanSelect
                        value={field.value ?? false}
                        onValueChange={(item) => {
                          field.onChange(item);
                          field.onBlur();
                        }}
                        trueLabel={t(
                          "services.options.form.duplicateAppointmentCheck.doNotAllowScheduling.labels.true",
                        )}
                        falseLabel={t(
                          "services.options.form.duplicateAppointmentCheck.doNotAllowScheduling.labels.false",
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duplicateAppointmentCheck.days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        "services.options.form.duplicateAppointmentCheck.days",
                      )}{" "}
                      <InfoTooltip>
                        {t(
                          "services.options.form.duplicateAppointmentCheck.daysTooltip",
                        )}
                      </InfoTooltip>
                    </FormLabel>
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
                              form.trigger("duplicateAppointmentCheck.enabled");
                            }}
                            onBlur={() => {
                              field.onBlur();
                              form.trigger("duplicateAppointmentCheck.enabled");
                            }}
                          />
                        </InputGroupInput>
                        <InputGroupAddon
                          className={InputGroupAddonClasses({
                            variant: "suffix",
                          })}
                        >
                          {t(
                            "services.options.form.duplicateAppointmentCheck.daysSuffix",
                          )}
                        </InputGroupAddon>
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="duplicateAppointmentCheck.message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t(
                      "services.options.form.duplicateAppointmentCheck.message",
                    )}{" "}
                    <InfoTooltip>
                      <I18nRichText
                        namespace="admin"
                        text="services.options.form.duplicateAppointmentCheck.messageTooltip"
                      />
                    </InfoTooltip>
                  </FormLabel>
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
                  <FormMessage />
                  <FormDescription>
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-2 [&[data-state=open]_svg]:rotate-90">
                        <I18nRichText
                          namespace="admin"
                          text="services.options.form.duplicateAppointmentCheck.messageExamples.label"
                          args={{
                            chevron: () => (
                              <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                            ),
                          }}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ul className="list-disc list-inside space-y-2 pt-2 pl-4 italic">
                          <li>
                            {t(
                              "services.options.form.duplicateAppointmentCheck.messageExamples.friendly",
                            )}
                          </li>
                          <li>
                            {t(
                              "services.options.form.duplicateAppointmentCheck.messageExamples.neutral",
                            )}
                          </li>
                          <li>
                            {t(
                              "services.options.form.duplicateAppointmentCheck.messageExamples.formal",
                            )}
                          </li>
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  </FormDescription>
                </FormItem>
              )}
            />
          </>
        )}
      </div>
    </div>
  );
};
