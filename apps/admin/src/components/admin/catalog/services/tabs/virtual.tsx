import { useI18n } from "@hacado/i18n/client";
import {
  BooleanSelect,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@hacado/ui";
import React from "react";
import { TabProps } from "./types";

export const VirtualTab: React.FC<TabProps> = ({ form, disabled }) => {
  const t = useI18n("admin");

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-medium">
        {t("catalog.services.form.onlineSettings.title")}
      </h3>
      <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
        <FormField
          control={form.control}
          name="isOnline"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("catalog.services.form.onlineSettings.isOnline.label")}
              </FormLabel>
              <FormControl>
                <BooleanSelect
                  value={field.value}
                  trueLabel={t(
                    "catalog.services.form.onlineSettings.isOnline.labels.true",
                  )}
                  falseLabel={t(
                    "catalog.services.form.onlineSettings.isOnline.labels.false",
                  )}
                  onValueChange={(value) => {
                    field.onChange(value);
                    field.onBlur();
                  }}
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>
                {t("catalog.services.form.onlineSettings.isOnline.tooltip")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
