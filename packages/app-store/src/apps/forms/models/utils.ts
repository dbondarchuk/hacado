import { zErrorMessageWithParams, zPhone, zUniqueArray } from "@hacado/types";
import { validateFileType } from "@hacado/utils";
import * as z from "zod";
import { FormsPublicAllKeys } from "../translations/types";
import type { FormsFieldsSchema } from "./fields";
import {
  defaultMaxFileSizeMb,
  defaultMultiLineLength,
  defaultOneLineLength,
} from "./fields";

type FormsField = FormsFieldsSchema[number];

export const zPossiblyOptional = (
  schema: z.ZodType<string>,
  required: boolean | undefined,
  message?: FormsPublicAllKeys,
) => {
  const zString = schema
    .transform((e) => (e === "" ? undefined : e))
    .refine((e) => e !== undefined, {
      message:
        message ??
        ("app_forms_public.validation.fields.required" satisfies FormsPublicAllKeys),
    });

  return required ? zString : zString.optional().nullable();
};

const zOptionalOrRequiredString = (
  required: boolean | undefined,
  min: { length: number; message: FormsPublicAllKeys },
  max: { length: number; message: FormsPublicAllKeys },
) => {
  const zString = z.union([
    z
      .string(
        "app_forms_public.validation.fields.required" satisfies FormsPublicAllKeys,
      )
      .min(
        min.length,
        zErrorMessageWithParams(min.message, { length: min.length }),
      )
      .max(
        max.length,
        zErrorMessageWithParams(max.message, { length: max.length }),
      ),
    z.string().length(0),
  ]);

  return zPossiblyOptional(zString, required);
};

function buildFieldValueSchema(
  field: FormsField,
  isAdmin: boolean,
): z.ZodTypeAny {
  switch (field.type) {
    case "name":
      return zOptionalOrRequiredString(
        field.required,
        { length: 2, message: "app_forms_public.validation.fields.name.min" },
        { length: 64, message: "app_forms_public.validation.fields.name.max" },
      );
    case "email":
      return zPossiblyOptional(
        z.email(
          "app_forms_public.validation.fields.email.invalid" satisfies FormsPublicAllKeys,
        ),
        field.required,
      );
    case "phone":
      return zPossiblyOptional(zPhone, field.required);
    case "oneLine":
    case "multiLine": {
      const data = field.data as
        | { minLength?: number; maxLength?: number }
        | undefined;

      return zOptionalOrRequiredString(
        field.required,
        {
          length: data?.minLength ?? 0,
          message:
            "app_forms_public.validation.fields.minLength" satisfies FormsPublicAllKeys,
        },
        {
          length:
            data?.maxLength ??
            (field.type === "oneLine"
              ? defaultOneLineLength
              : defaultMultiLineLength),
          message:
            "app_forms_public.validation.fields.maxLength" satisfies FormsPublicAllKeys,
        },
      );
    }
    case "checkbox":
      if (field.required) {
        return z.literal(true, {
          message:
            "app_forms_public.validation.fields.checkbox.required" satisfies FormsPublicAllKeys,
        });
      }

      return z.coerce.boolean<boolean>().optional().nullable();
    case "select":
    case "radio": {
      const data = field.data as { options: { option: string }[] };
      const options = data?.options?.map((o) => o.option) ?? [];
      const zString = z.string().refine((val) => options.includes(val), {
        message:
          "app_forms_public.validation.fields.select.unknownOption" satisfies FormsPublicAllKeys,
      });

      return zPossiblyOptional(
        zString,
        field.required,
        "app_forms_public.validation.fields.select.unknownOption" satisfies FormsPublicAllKeys,
      );
    }
    case "multiSelect": {
      const data = field.data as {
        options: { option: string }[];
        minSelected?: number;
        maxSelected?: number;
      };
      const options = data?.options?.map((o) => o.option) ?? [];
      let schema = zUniqueArray(
        z
          .array(
            z.string().refine((val) => options.includes(val), {
              message:
                "app_forms_public.validation.fields.multiSelect.unknownOption" satisfies FormsPublicAllKeys,
            }),
          )
          .refine((arr) => arr.every((v) => options.includes(v)), {
            message:
              "app_forms_public.validation.fields.multiSelect.unknownOption" satisfies FormsPublicAllKeys,
          }),
        (item) => item,
        "app_forms_public.validation.fields.multiSelect.unique" satisfies FormsPublicAllKeys,
      );

      if (data?.minSelected != null) {
        schema = schema.refine((arr) => arr.length >= data.minSelected!, {
          message: zErrorMessageWithParams(
            "app_forms_public.validation.fields.multiSelect.minSelected" satisfies FormsPublicAllKeys,
            {
              minSelected: data.minSelected,
            },
          ),
        }) as typeof schema;
      }
      if (data?.maxSelected != null) {
        schema = schema.refine((arr) => arr.length <= data.maxSelected!, {
          message: zErrorMessageWithParams(
            "app_forms_public.validation.fields.multiSelect.maxSelected" satisfies FormsPublicAllKeys,
            {
              maxSelected: data.maxSelected,
            },
          ),
        }) as typeof schema;
      }

      if (field.required) {
        return schema.min(
          1,
          "app_forms_public.validation.fields.multiSelect.required" satisfies FormsPublicAllKeys,
        );
      }

      return schema.optional().nullable();
    }
    case "file":
      if (isAdmin) {
        return zPossiblyOptional(
          z.string(
            "app_forms_public.validation.fields.file.required" satisfies FormsPublicAllKeys,
          ),
          field.required,
          "app_forms_public.validation.fields.file.required" satisfies FormsPublicAllKeys,
        );
      }

      return z
        .custom((f) => typeof f === "undefined" || f instanceof File, {
          message:
            "app_forms_public.validation.fields.file.type" satisfies FormsPublicAllKeys,
        })
        .refine(
          (file) => !field.required || !!file,
          "app_forms_public.validation.fields.file.required" satisfies FormsPublicAllKeys,
        )
        .refine((file) => {
          if (field.required && !file) return false;
          if (!(file instanceof File)) return false;

          if (!field.data?.accept) return true;

          return field.data.accept.every((accept) =>
            validateFileType(file, accept),
          );
        }, "app_forms_public.validation.fields.file.accept" satisfies FormsPublicAllKeys)
        .refine(
          (file) => {
            if (field.required && !file) return false;

            const maxSizeMb = field.data?.maxSizeMb ?? defaultMaxFileSizeMb;
            return (
              !maxSizeMb ||
              !file ||
              (file as File).size < maxSizeMb * 1024 * 1024
            );
          },
          {
            message: zErrorMessageWithParams(
              "app_forms_public.validation.fields.file.maxSize" satisfies FormsPublicAllKeys,
              {
                maxSizeMb: field.data?.maxSizeMb ?? defaultMaxFileSizeMb,
              },
            ),
          },
        );
    default:
      return z.unknown();
  }
}

/**
 * Builds a Zod schema that validates user-submitted form response data.
 * Keys are field names, values are validated per field type and constraints.
 */
export function getFormResponseSchema(
  fields: FormsFieldsSchema,
  isAdmin: boolean,
) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    let schema = buildFieldValueSchema(field, isAdmin);
    if (!field.required) {
      schema = schema.optional().nullable();
    }
    shape[field.name] = schema;
  }
  return z.object(shape);
}
