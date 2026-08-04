import { useI18n } from "@timelish/i18n/client";
import { Id } from "@timelish/types";
import { Sortable } from "@timelish/ui-admin";
import React from "react";
import { useFieldArray } from "react-hook-form";
import { OptionSelectCard } from "./cards/option-select-card";
import { TabProps } from "./types";

export const OptionsTab: React.FC<TabProps> = ({ form, disabled }) => {
  const t = useI18n("admin");
  const {
    fields: options,
    append,
    remove,
    swap,
  } = useFieldArray({
    control: form.control,
    name: "options",
    keyName: "fields_id",
  });

  const ids = React.useMemo(() => options.map((x) => x.fields_id), [options]);

  const sort = (activeId: string, overId: string) => {
    const activeIndex = options.findIndex((x) => x.fields_id === activeId);
    const overIndex = options.findIndex((x) => x.fields_id === overId);

    if (activeIndex < 0 || overIndex < 0) return;

    swap(activeIndex, overIndex);
  };

  const addNew = () => {
    append({} as Partial<Id> as Id);
  };

  return (
    <Sortable
      title={t("settings.appointments.form.options.title")}
      ids={ids}
      onSort={sort}
      onAdd={addNew}
    >
      <div className="flex flex-grow flex-col gap-4">
        {options.map((item, index) => {
          return (
            <OptionSelectCard
              form={form}
              item={item}
              key={item.fields_id}
              excludeIds={form
                .getValues("options")
                ?.map((o) => o.id)
                .filter((id) => id !== form.getValues(`options.${index}`).id)}
              name={`options.${index}`}
              disabled={disabled}
              remove={() => remove(index)}
            />
          );
        })}
      </div>
    </Sortable>
  );
};
