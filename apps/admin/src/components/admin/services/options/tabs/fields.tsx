import { useI18n } from "@hacado/i18n/client";
import { WithDatabaseId } from "@hacado/types";
import { Sortable } from "@hacado/ui-admin";
import React from "react";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import { FieldSelectCard } from "../../field-select-card";
import { TabProps } from "./types";

export const FieldsTab: React.FC<TabProps> = ({ form, disabled }) => {
  const t = useI18n("admin");

  const {
    fields: fieldsFields,
    append: appendField,
    remove: removeField,
    swap: swapFields,
    update: updateField,
  } = useFieldArray({
    control: form.control,
    name: "fields",
    keyName: "fields_id",
  });

  const fieldsFieldsIds = fieldsFields.map((x) => x.fields_id);

  const sortFields = (activeId: string, overId: string) => {
    const activeIndex = fieldsFields.findIndex((x) => x.fields_id === activeId);

    const overIndex = fieldsFields.findIndex((x) => x.fields_id === overId);

    if (activeIndex < 0 || overIndex < 0) return;

    swapFields(activeIndex, overIndex);
  };

  const addNewField = () => {
    appendField({
      id: "",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Sortable
        title={t("services.options.form.fields")}
        ids={fieldsFieldsIds}
        onSort={sortFields}
        onAdd={addNewField}
      >
        <div className="flex flex-grow flex-col gap-4">
          {fieldsFields.map((item, index) => {
            return (
              <FieldSelectCard
                form={form as UseFormReturn<any>}
                type="option"
                item={item as WithDatabaseId<any>}
                key={(item as WithDatabaseId<any>).id}
                name={`fields.${index}`}
                disabled={disabled}
                remove={() => removeField(index)}
                excludeIds={form
                  .getValues("fields")
                  ?.filter(
                    ({ id }, i) =>
                      id !== form.getValues(`fields.${index}`)?.id &&
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
