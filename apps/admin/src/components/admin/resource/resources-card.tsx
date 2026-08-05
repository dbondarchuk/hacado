import { Sortable } from "@hacado/ui-admin";
import { useMemo } from "react";
import {
  ArrayPath,
  FieldArray,
  FieldArrayPath,
  FieldValues,
  useFieldArray,
  UseFormReturn,
} from "react-hook-form";
import { ResourceCard, ResourceWithId } from "./resource-card";

export type ResourcesCardProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  name: FieldArrayPath<T>;
  title: string;
  loading?: boolean;
  type: "script" | "css";
};

export const ResourcesCard = <T extends FieldValues>({
  form,
  name,
  title,
  loading,
  type,
}: ResourcesCardProps<T>) => {
  const { fields, append, remove, swap, update } = useFieldArray({
    control: form.control,
    name,
  });

  const ids = useMemo(() => fields.map((x) => x.id), [fields]);

  const sort = (activeId: string, overId: string) => {
    const activeIndex = fields.findIndex((x) => x.id === activeId);
    const overIndex = fields.findIndex((x) => x.id === overId);

    if (activeIndex < 0 || overIndex < 0) return;

    swap(activeIndex, overIndex);
  };

  const addNew = () => {
    append({
      type: "remote",
    } as FieldArray<T, ArrayPath<T>>);
  };

  return (
    <Sortable title={title} ids={ids} onSort={sort} onAdd={addNew}>
      <div className="flex flex-grow flex-col gap-4">
        {fields.map((item, index) => {
          return (
            <ResourceCard
              type={type}
              form={form}
              item={item as ResourceWithId}
              key={item.id}
              name={`${name}.${index}`}
              disabled={loading}
              remove={() => remove(index)}
              update={(newValue) =>
                update(index, newValue as FieldArray<T, ArrayPath<T>>)
              }
            />
          );
        })}
      </div>
    </Sortable>
  );
};
