import { adminApi } from "@hacado/api-sdk";
import { I18nFn, useI18n } from "@hacado/i18n/client";
import { ServiceField } from "@hacado/types";
import { cn, Combobox, IComboboxItem } from "@hacado/ui";
import React from "react";

const FieldLabel: React.FC<{ field: ServiceField; t: I18nFn<"admin"> }> = ({
  field,
  t,
}) => {
  return (
    <span className="inline-flex items-center gap-2 shrink overflow-hidden text-nowrap min-w-0">
      {field.data.label}{" "}
      <span className="text-xs italic">
        {field.name} - {t(`common.labels.fieldType.${field.type}`)}
      </span>
    </span>
  );
};

const getFields = async () => {
  const response = await adminApi.serviceFields.getServiceFields({
    limit: 10000,
  });

  return response.items;
};

const checkFieldSearch = (
  field: ServiceField,
  query: string,
  t: I18nFn<"admin">,
) => {
  const search = query.toLocaleLowerCase();
  return (
    field.name.toLocaleLowerCase().includes(search) ||
    field.data.label.toLocaleLowerCase().includes(search) ||
    t(`common.labels.fieldType.${field.type}`)
      .toLocaleUpperCase()
      .includes(search)
  );
};

export type FieldSelectorProps = {
  value?: string;
  disabled?: boolean;
  excludeIds?: string[];
  className?: string;
  onItemSelect?: (value: string) => void;
};

export const FieldSelector: React.FC<FieldSelectorProps> = ({
  disabled,
  className,
  excludeIds,
  value,
  onItemSelect,
}) => {
  const t = useI18n("admin");
  const [fields, setFields] = React.useState<ServiceField[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const fn = async () => {
      try {
        setIsLoading(true);
        const fields = await getFields();
        setFields(fields);
      } finally {
        setIsLoading(false);
      }
    };

    fn();
  }, []);

  const FieldValues = (fields: ServiceField[]): IComboboxItem[] =>
    fields
      .filter(({ _id }) => !excludeIds?.find((id) => id === _id))
      .map((field) => {
        return {
          value: field._id,
          shortLabel: <FieldLabel field={field} t={t} />,
          label: <FieldLabel field={field} t={t} />,
        };
      });

  return (
    // @ts-ignore Allow clear passthrough
    <Combobox
      disabled={disabled || isLoading}
      className={cn("flex font-normal text-base", className)}
      values={FieldValues(fields)}
      searchLabel={
        isLoading
          ? t("services.fieldSelector.loading")
          : t("services.fieldSelector.selectField")
      }
      value={value}
      customSearch={(search) =>
        FieldValues(fields.filter((app) => checkFieldSearch(app, search, t)))
      }
      onItemSelect={onItemSelect}
    />
  );
};
