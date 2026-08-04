import { useI18n } from "@timelish/i18n/client";
import { WithDatabaseId } from "@timelish/types";
import { Sortable } from "@timelish/ui-admin";
import React from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { AddonSelectCard } from "../addon-select-card";
import { TabProps } from "./types";

export const AddonsTab: React.FC<TabProps> = ({ form, disabled }) => {
  const t = useI18n("admin");

  const {
    fields: addonsFields,
    append: appendAddon,
    remove: removeAddon,
    swap: swapAddons,
    update: updateAddon,
  } = useFieldArray({
    control: form.control,
    name: "addons",
    keyName: "fields_id",
  });

  const addonsFieldsIds = addonsFields.map((x) => x.fields_id);

  const sortAddons = (activeId: string, overId: string) => {
    const activeIndex = addonsFields.findIndex((x) => x.fields_id === activeId);

    const overIndex = addonsFields.findIndex((x) => x.fields_id === overId);

    if (activeIndex < 0 || overIndex < 0) return;

    swapAddons(activeIndex, overIndex);
  };

  const addNewAddon = () => {
    appendAddon({
      id: "",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Sortable
        title={t("services.options.form.addons")}
        ids={addonsFieldsIds}
        onSort={sortAddons}
        onAdd={addNewAddon}
      >
        <div className="flex flex-grow flex-col gap-4">
          {addonsFields.map((item, index) => {
            return (
              <AddonSelectCard
                form={form as UseFormReturn<any>}
                item={item as WithDatabaseId<any>}
                key={(item as WithDatabaseId<any>).id}
                name={`addons.${index}`}
                disabled={disabled}
                remove={() => removeAddon(index)}
                excludeIds={form
                  .getValues("addons")
                  ?.filter(
                    ({ id }, i) =>
                      id !== form.getValues(`addons.${index}`)?.id &&
                      i !== index,
                  )
                  .map(({ id }) => id)}
              />
            );
          })}
        </div>
      </Sortable>
    </div>
  );
};
