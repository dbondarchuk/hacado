import { useI18n } from "@timelish/i18n/client";
import {
  BooleanSelect,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  InfoTooltip,
} from "@timelish/ui";
import React from "react";
import { TabProps } from "./types";

export const VirtualTab: React.FC<TabProps> = ({ form, disabled }) => {
  const t = useI18n("admin");

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium">
        {t("services.options.form.onlineSettings.title")}
      </h3>
      <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
        <FormField
          control={form.control}
          name="isOnline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("services.options.form.onlineSettings.isOnline.label")}{" "}
                <InfoTooltip>
                  {t("services.options.form.onlineSettings.isOnline.tooltip")}
                </InfoTooltip>
              </FormLabel>
              <FormControl>
                <BooleanSelect
                  value={field.value}
                  trueLabel={t(
                    "services.options.form.onlineSettings.isOnline.labels.true",
                  )}
                  falseLabel={t(
                    "services.options.form.onlineSettings.isOnline.labels.false",
                  )}
                  onValueChange={(value) => {
                    field.onChange(value);
                    field.onBlur();
                  }}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
