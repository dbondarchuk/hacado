import * as z from "zod";

import { WithDatabaseId, WithOrganizationId } from "../database";
import {
  asOptinalNumberField,
  Prettify,
  zNonEmptyString,
  zOptionalOrMinMaxLengthString,
  zUniqueArray,
} from "../utils";
import { fieldTypes } from "./fields";

const fieldTypeEnum = z.enum(fieldTypes, {
  message: "fields.type.invalid",
});

export const defaultFieldDataSchema = z.object({
  label: zNonEmptyString(
    "validation.fields.label.required",
    1,
    256,
    "validation.fields.label.max",
  ),
  // description: z.array(z.any()),
  description: zOptionalOrMinMaxLengthString(
    {
      length: 3,
      message: "validation.fields.description.min",
    },
    {
      length: 1024,
      message: "validation.fields.description.max",
    },
  ),
});

export const selectFieldDataSchema = z.object({
  ...defaultFieldDataSchema.shape,
  options: zUniqueArray(
    z.array(
      z.object({
        option: zNonEmptyString(
          "validation.fields.option.required",
          1,
          256,
          "validation.fields.option.max",
        ),
      }),
    ),
    (item) => item.option,
    "fields.option.unique",
  ).min(1, "validation.fields.options.min"),
});

export const fileFieldAcceptItemSchema = zNonEmptyString(
  "validation.fields.accept.min",
).regex(
  /(\.[a-zA-Z0-9]+$)|(^(image|video|audio)\/\*$)|(^[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_\.]+$)/,
  "validation.fields.accept.invalid",
);

export const fileFieldDataSchema = z.object({
  ...defaultFieldDataSchema.shape,
  accept: zUniqueArray(z.array(fileFieldAcceptItemSchema), (x) => x).optional(),
  maxSizeMb: asOptinalNumberField(
    z.coerce
      .number<number>()
      .min(1, "validation.fields.maxSizeMb.min")
      .max(100, "validation.fields.maxSizeMb.max"),
  ),
});

export const baseFieldSchema = z.object({
  name: zNonEmptyString(
    "fields.name.required",
    2,
    64,
    "fields.name.max",
  ).refine(
    (s) => /^[a-z_][a-z0-9_]+$/i.test(s),
    "validation.fields.name.invalid",
  ),
  required: z.coerce.boolean<boolean>().optional(),
});

export const fieldSchema = z.discriminatedUnion("type", [
  z.object({
    ...baseFieldSchema.shape,
    type: fieldTypeEnum.extract(["select"]),
    data: selectFieldDataSchema,
  }),
  z.object({
    ...baseFieldSchema.shape,
    type: fieldTypeEnum.extract(["file"]),
    data: fileFieldDataSchema,
  }),
  z.object({
    ...baseFieldSchema.shape,
    type: fieldTypeEnum.exclude(["select", "file"]),
    data: defaultFieldDataSchema,
  }),
]);

export const getFieldSchemaWithUniqueCheck = (
  uniqueNameCheckFn: (name: string) => Promise<boolean>,
  message: string,
) => {
  return fieldSchema.superRefine(async (args, ctx) => {
    if (!args.name) return;

    const isUnique = await uniqueNameCheckFn(args.name);
    if (!isUnique) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message,
      });
    }
  });
};

export type FieldSchema = z.infer<typeof fieldSchema>;

export const fieldsSchema = z.array(fieldSchema).optional();
export type FieldsSchema = z.infer<typeof fieldsSchema>;

export type ServiceFieldUpdateModel = FieldSchema;
export type ServiceField = Prettify<
  WithOrganizationId<
    WithDatabaseId<ServiceFieldUpdateModel> & {
      updatedAt: Date;
    }
  >
>;
