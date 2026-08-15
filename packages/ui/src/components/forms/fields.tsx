import { TranslationKeys } from "@hacado/i18n";
import {
  Field,
  FieldFileData,
  FieldOptionsData,
  FieldType,
  WithLabelFieldData,
  zNonEmptyString,
  zPossiblyOptionalMinMaxLengthString,
} from "@hacado/types";
import { Control } from "react-hook-form";
import { z, ZodSchema, ZodTypeAny } from "zod";
import { CheckboxField } from "./checkbox-field";
import { EmailField } from "./email";
import { FileField } from "./file";
import { MultiLineField } from "./multi-line";
import { NameField } from "./name";
import { OneLineField } from "./one-line";
import { PhoneField } from "./phone";
import { SelectField } from "./select";

export const fieldsSchemaMap: Record<FieldType, (field: Field) => ZodSchema> = {
  name: (field: Field) =>
    zNonEmptyString(
      "validation.name.required" satisfies TranslationKeys,
      2,
      256,
      "validation.name.max" satisfies TranslationKeys,
    ),

  email: (field: Field) =>
    z
      .email("validation.email.invalid" satisfies TranslationKeys)
      .max(256, "validation.email.max" satisfies TranslationKeys),
  phone: (field: Field) =>
    (
      zPossiblyOptionalMinMaxLengthString(
        field.required,
        {
          length: 1,
          message: "validation.phone.required" satisfies TranslationKeys,
        },
        {
          length: 32,
          message: "validation.phone.max" satisfies TranslationKeys,
        },
      ) as ZodTypeAny
    ).refine(
      (s: unknown) => typeof s !== "string" || !s.includes("_"),
      "validation.phone.invalid" satisfies TranslationKeys,
    ),
  oneLine: (field: Field) =>
    zPossiblyOptionalMinMaxLengthString(
      field.required,
      {
        length: 1,
        message: "validation.text.required" satisfies TranslationKeys,
      },
      {
        length: 256,
        message: "validation.text.maxOneLine" satisfies TranslationKeys,
      },
    ),
  multiLine: (field: Field) =>
    zPossiblyOptionalMinMaxLengthString(
      field.required,
      {
        length: 1,
        message: "validation.text.required" satisfies TranslationKeys,
      },
      {
        length: 4096,
        message: "validation.text.maxMultiLine" satisfies TranslationKeys,
      },
    ),
  checkbox: (field: Field) =>
    z
      .boolean()
      .default(false)
      .refine(
        (arg) => (field.required ? !!arg : true),
        "validation.checkbox.required" satisfies TranslationKeys,
      ),
  select: (field: Field) => {
    const [firstOption, ...restOptions] = (
      field as unknown as Field<FieldOptionsData>
    ).data.options.map((x) => x.option);

    return z
      .enum([firstOption, ...restOptions], {
        message: "validation.select.required" satisfies TranslationKeys,
      })
      .refine(
        (arg) => (field.required ? !!arg : true),
        "validation.select.required" satisfies TranslationKeys,
      );
  },
  file: (field: Field) => {
    return z
      .custom((f) => typeof f === "undefined" || f instanceof File, {
        message: "validation.file.type" satisfies TranslationKeys,
      })
      .refine(
        (file) => !field.required || !!file,
        "validation.file.required" satisfies TranslationKeys,
      )
      .refine(
        (file) => {
          if (field.required && !file) return false;

          const maxSizeMb = (field.data as unknown as FieldFileData)?.maxSizeMb;
          return (
            !maxSizeMb || !file || (file as File).size < maxSizeMb * 1024 * 1024
          );
        },
        {
          message: "validation.file.maxSize" satisfies TranslationKeys,

          params: {
            maxSizeMb: (field.data as unknown as FieldFileData).maxSizeMb,
          },
        },
      );
  },
};

export const fieldSchemaMapper = (field: Field) => {
  let schema: z.ZodType = fieldsSchemaMap[field.type](field);
  if (!field.required) schema = schema.optional();

  return schema;
};

export type FieldComponentMapFn = (
  field: Field<any>,
  control: Control,
  disabled?: boolean,
) => React.ReactNode;

export const fieldsComponentMap: (
  namespace?: string,
  afterChange?: (value: any) => void,
) => Record<FieldType, FieldComponentMapFn> = (namespace, afterChange) => ({
  name: (field, control, disabled) => (
    <NameField
      control={control}
      {...field}
      disabled={disabled}
      namespace={namespace}
      afterChange={afterChange}
    />
  ),
  email: (field, control, disabled) => (
    <EmailField
      control={control}
      {...field}
      disabled={disabled}
      namespace={namespace}
      afterChange={afterChange}
    />
  ),
  phone: (field, control, disabled) => (
    <PhoneField
      control={control}
      disabled={disabled}
      {...(field as Field<WithLabelFieldData>)}
      namespace={namespace}
      afterChange={afterChange}
    />
  ),
  oneLine: (field, control, disabled) => (
    <OneLineField
      control={control}
      disabled={disabled}
      {...(field as Field<WithLabelFieldData>)}
      namespace={namespace}
      afterChange={afterChange}
    />
  ),
  multiLine: (field, control, disabled) => (
    <MultiLineField
      control={control}
      disabled={disabled}
      {...(field as Field<WithLabelFieldData>)}
      namespace={namespace}
      afterChange={afterChange}
    />
  ),
  checkbox: (field, control, disabled) => (
    <CheckboxField
      control={control}
      disabled={disabled}
      {...(field as Field<WithLabelFieldData>)}
      namespace={namespace}
      afterChange={afterChange}
    />
  ),
  select: (field, control, disabled) => (
    <SelectField
      control={control}
      disabled={disabled}
      {...(field as Field<WithLabelFieldData & FieldOptionsData>)}
      namespace={namespace}
      afterChange={afterChange}
    />
  ),
  file: (field, control, disabled) => (
    <FileField
      control={control}
      disabled={disabled}
      {...(field as Field<WithLabelFieldData & FieldFileData>)}
      namespace={namespace}
      afterChange={afterChange}
    />
  ),
});
