import {
  asOptinalNumberField,
  WithDatabaseId,
  WithOrganizationId,
  zNonEmptyString,
  zOptionalOrMinMaxLengthString,
  zUniqueArray,
} from "@hacado/types";
import * as z from "zod";
import { FormsAdminAllKeys } from "../translations/types";

export const formsFieldTypes = [
  "name",
  "email",
  "phone",
  "oneLine",
  "multiLine",
  "checkbox",
  "select",
  "file",
  "radio",
  "multiSelect",
] as const;

export const maxMaxFileSizeMb = 100;
export const defaultMaxFileSizeMb = 5;
export const maxOneLineLength = 256;
export const maxMultiLineLength = 4096;
export const defaultOneLineLength = 64;
export const defaultMultiLineLength = 1024;

export type FormsFieldType = (typeof formsFieldTypes)[number];

export type FormsFieldData<
  TData extends Record<string, any> | undefined = undefined,
> = {
  label: string;
  required?: boolean;
  description?: string;
} & (TData extends undefined ? { data?: never } : { data: TData });

export type FormsField<
  TData extends Record<string, any> | undefined = undefined,
> = FormsFieldData<TData> & {
  type: FormsFieldType;
};

export type FormsFields<
  TData extends Record<string, any> | undefined = undefined,
> = FormsField<TData>[];

export type FormsFieldsWithId<
  TData extends Record<string, any> | undefined = undefined,
> = WithDatabaseId<
  WithOrganizationId<FormsField<TData> & { appId: string; formId: string }>
>[];

export type FormsFieldOptionsData = {
  options: {
    option: string;
  }[];
};

export type FormsFieldFileData = {
  accept?: string[];
  maxSizeMb?: number;
};

export type FormsMultiSelectConstraints = {
  minSelected?: number;
  maxSelected?: number;
};

export type FormsFieldMultiSelectData = FormsFieldOptionsData &
  FormsMultiSelectConstraints;

export const formsFieldTypeEnum = z.enum(formsFieldTypes, {
  message:
    "app_forms_admin.validation.form.fields.type.invalid" satisfies FormsAdminAllKeys,
});

export const formsTextFieldDataSchema = (
  type: Extract<FormsFieldType, "oneLine" | "multiLine">,
) =>
  z
    .object({
      minLength: asOptinalNumberField(
        z.coerce
          .number<number>(
            "app_forms_admin.validation.form.fields.text.minLength.invalid" satisfies FormsAdminAllKeys,
          )
          .int(
            "app_forms_admin.validation.form.fields.text.minLength.invalid" satisfies FormsAdminAllKeys,
          )
          .positive(
            "app_forms_admin.validation.form.fields.text.minLength.invalid" satisfies FormsAdminAllKeys,
          ),
      ),
      maxLength: asOptinalNumberField(
        z.coerce
          .number<number>(
            "app_forms_admin.validation.form.fields.text.maxLength.invalid" satisfies FormsAdminAllKeys,
          )
          .int(
            "app_forms_admin.validation.form.fields.text.maxLength.invalid" satisfies FormsAdminAllKeys,
          )
          .positive(
            "app_forms_admin.validation.form.fields.text.maxLength.invalid" satisfies FormsAdminAllKeys,
          )
          .max(
            type === "oneLine" ? maxOneLineLength : maxMultiLineLength,
            `app_forms_admin.validation.form.fields.${type}.maxLength.max` satisfies FormsAdminAllKeys,
          ),
      ),
    })
    .refine(
      (data) =>
        typeof data.minLength === "undefined" ||
        typeof data.maxLength === "undefined" ||
        data.minLength <= data.maxLength,
      {
        message:
          "app_forms_admin.validation.form.fields.text.minMaxRange.invalid" satisfies FormsAdminAllKeys,
        path: ["maxLength"],
      },
    );

export const formsSelectFieldDataSchema = z.object({
  options: zUniqueArray(
    z
      .array(
        z.object({
          option: zNonEmptyString(
            "app_forms_admin.validation.form.fields.options.value.min" satisfies FormsAdminAllKeys,
            2,
          ).max(
            256,
            "app_forms_admin.validation.form.fields.options.value.max" satisfies FormsAdminAllKeys,
          ),
        }),
      )
      .min(
        2,
        "app_forms_admin.validation.form.fields.options.min" satisfies FormsAdminAllKeys,
      )
      .max(
        32,
        "app_forms_admin.validation.form.fields.options.max" satisfies FormsAdminAllKeys,
      ),
    (item) => item.option,
    "app_forms_admin.validation.form.fields.options.unique" satisfies FormsAdminAllKeys,
  ),
});

export const formsMultiSelectFieldDataSchema = z
  .object({
    ...formsSelectFieldDataSchema.shape,
    minSelected: asOptinalNumberField(
      z.coerce
        .number<number>(
          "app_forms_admin.validation.form.fields.multiSelect.minSelected.invalid" satisfies FormsAdminAllKeys,
        )
        .int(
          "app_forms_admin.validation.form.fields.multiSelect.minSelected.invalid" satisfies FormsAdminAllKeys,
        )
        .positive(
          "app_forms_admin.validation.form.fields.multiSelect.minSelected.invalid" satisfies FormsAdminAllKeys,
        ),
    ),
    maxSelected: asOptinalNumberField(
      z.coerce
        .number<number>(
          "app_forms_admin.validation.form.fields.multiSelect.maxSelected.invalid" satisfies FormsAdminAllKeys,
        )
        .int(
          "app_forms_admin.validation.form.fields.multiSelect.maxSelected.invalid" satisfies FormsAdminAllKeys,
        )
        .min(
          1,
          "app_forms_admin.validation.form.fields.multiSelect.maxSelected.min" satisfies FormsAdminAllKeys,
        ),
    ),
  })
  .refine(
    (data) =>
      typeof data.minSelected === "undefined" ||
      typeof data.maxSelected === "undefined" ||
      data.minSelected <= data.maxSelected,
    {
      message:
        "app_forms_admin.validation.form.fields.multiSelect.minMaxRange.invalid" satisfies FormsAdminAllKeys,
      path: ["maxSelected"],
    },
  );

export const formsFileFieldAcceptItemSchema = zNonEmptyString(
  "app_forms_admin.validation.form.fields.file.accept.invalid" satisfies FormsAdminAllKeys,
).regex(
  /(\.[a-zA-Z0-9]+$)|(^(image|video|audio)\/\*$)|(^[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_\.]+$)/,
  "app_forms_admin.validation.form.fields.file.accept.invalid" satisfies FormsAdminAllKeys,
);

export const formsFileFieldDataSchema = z.object({
  accept: zUniqueArray(
    z.array(formsFileFieldAcceptItemSchema),
    (x) => x,
    "app_forms_admin.validation.form.fields.file.accept.unique" satisfies FormsAdminAllKeys,
  ).optional(),
  maxSizeMb: asOptinalNumberField(
    z.coerce
      .number<number>()
      .min(
        1,
        "app_forms_admin.validation.form.fields.file.maxSizeMb.min" satisfies FormsAdminAllKeys,
      )
      .max(
        maxMaxFileSizeMb,
        "app_forms_admin.validation.form.fields.file.maxSizeMb.max" satisfies FormsAdminAllKeys,
      ),
  ),
});

export const formsBaseFieldSchema = z.object({
  name: zNonEmptyString(
    "app_forms_admin.validation.form.fields.name.required" satisfies FormsAdminAllKeys,
    2,
  )
    .max(
      64,
      "app_forms_admin.validation.form.fields.name.max" satisfies FormsAdminAllKeys,
    )
    .refine(
      (s) => /^[a-z_][a-z0-9_]+$/i.test(s),
      "app_forms_admin.validation.form.fields.name.invalid" satisfies FormsAdminAllKeys,
    ),
  label: zNonEmptyString(
    "app_forms_admin.validation.form.fields.label.required" satisfies FormsAdminAllKeys,
    1,
  ).max(
    64,
    "app_forms_admin.validation.form.fields.label.max" satisfies FormsAdminAllKeys,
  ),
  description: zOptionalOrMinMaxLengthString(
    {
      length: 10,
      message:
        "app_forms_admin.validation.form.fields.description.min" satisfies FormsAdminAllKeys,
    },
    {
      length: 256,
      message:
        "app_forms_admin.validation.form.fields.description.max" satisfies FormsAdminAllKeys,
    },
  ),
  required: z.coerce.boolean<boolean>().optional(),
});

export const formsFieldSchema = z.discriminatedUnion("type", [
  z.object({
    ...formsBaseFieldSchema.shape,
    type: formsFieldTypeEnum.extract(["select"]),
    data: formsSelectFieldDataSchema,
  }),
  z.object({
    ...formsBaseFieldSchema.shape,
    type: formsFieldTypeEnum.extract(["file"]),
    data: formsFileFieldDataSchema,
  }),
  z.object({
    ...formsBaseFieldSchema.shape,
    type: formsFieldTypeEnum.extract(["radio"]),
    data: formsSelectFieldDataSchema,
  }),
  z.object({
    ...formsBaseFieldSchema.shape,
    type: formsFieldTypeEnum.extract(["multiSelect"]),
    data: formsMultiSelectFieldDataSchema,
  }),
  z.object({
    ...formsBaseFieldSchema.shape,
    type: formsFieldTypeEnum.extract(["oneLine"]),
    data: formsTextFieldDataSchema("oneLine"),
  }),
  z.object({
    ...formsBaseFieldSchema.shape,
    type: formsFieldTypeEnum.extract(["multiLine"]),
    data: formsTextFieldDataSchema("multiLine"),
  }),
  z.object({
    ...formsBaseFieldSchema.shape,
    type: formsFieldTypeEnum.exclude([
      "select",
      "file",
      "radio",
      "multiSelect",
      "oneLine",
      "multiLine",
    ]),
  }),
]);

export const formsFieldsSchema = zUniqueArray(
  zUniqueArray(
    z
      .array(formsFieldSchema)
      .min(
        1,
        "app_forms_admin.validation.form.fields.min" satisfies FormsAdminAllKeys,
      ),
    (field) => field.name,
    "app_forms_admin.validation.form.fields.unique" satisfies FormsAdminAllKeys,
  ),
  (field) => field.label,
  "app_forms_admin.validation.form.fields.unique" satisfies FormsAdminAllKeys,
);

export type FormsFieldSchema = z.infer<typeof formsFieldSchema>;
export type FormsFieldsSchema = z.infer<typeof formsFieldsSchema>;
