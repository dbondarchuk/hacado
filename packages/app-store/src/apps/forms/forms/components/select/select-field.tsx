import { useI18n } from "@timelish/i18n/client";
import { Sortable } from "@timelish/ui-admin";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { formSchemaBase } from "../../../models";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../../translations/types";
import { SelectFieldOptionCard } from "./select-field-option-card";

export const SelectField = ({
  form,
  name: fieldName,
  disabled,
}: {
  form: UseFormReturn<z.infer<typeof formSchemaBase>>;
  name: `fields.${number}`;
  disabled?: boolean;
}) => {
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);

  const {
    fields: selectOptionsFields,
    append: appendSelectOption,
    remove: removeSelectOption,
    swap: swapSelectOptions,
  } = useFieldArray({
    control: form.control,
    name: `${fieldName}.data.options`,
  });

  const sortSelectOptions = (activeId: string, overId: string) => {
    const activeIndex = selectOptionsFields.findIndex((x) => x.id === activeId);

    const overIndex = selectOptionsFields.findIndex((x) => x.id === overId);

    if (activeIndex < 0 || overIndex < 0) return;

    swapSelectOptions(activeIndex, overIndex);
  };

  const addNewSelectOption = () => {
    appendSelectOption({
      option: "",
    });
  };

  const selectOptionsIds = selectOptionsFields.map((x) => x.id);
  const { invalid, error } = form.getFieldState(`${fieldName}.data.options`);

  return (
    <Sortable
      invalid={
        invalid
          ? {
              isInvalid: invalid,
              message: error?.message,
            }
          : false
      }
      title={t("form.fields.select.options.label")}
      ids={selectOptionsIds}
      onSort={sortSelectOptions}
      onAdd={addNewSelectOption}
      disabled={disabled}
    >
      <div className="flex flex-grow flex-col gap-4">
        {selectOptionsFields.map((item, index) => {
          return (
            <SelectFieldOptionCard
              form={form}
              item={item}
              key={item.id}
              name={`${fieldName}.data.options.${index}`}
              disabled={disabled}
              remove={() => removeSelectOption(index)}
            />
          );
        })}
      </div>
    </Sortable>
  );
};
