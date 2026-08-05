import {
  asOptionalField,
  Customer,
  dateRangeSchema,
  Prettify,
  querySchema,
  WithAppId,
  WithDatabaseId,
  WithOrganizationId,
  zEmail,
  zNonEmptyString,
  zObjectId,
} from "@hacado/types";
import * as z from "zod";
import { FormsAdminAllKeys } from "../translations/types";
import { formsFieldsSchema, FormsFieldType } from "./fields";

export const FORMS_COLLECTION_NAME = "forms";
export const FORM_RESPONSES_COLLECTION_NAME = "form-responses";

export const formsNotificationSchema = z.object({
  enabled: z.coerce.boolean<boolean>().optional(),
  email: asOptionalField(zEmail),
});

export type FormsNotification = z.infer<typeof formsNotificationSchema>;

export const formSchemaBase = z.object({
  name: zNonEmptyString(
    "app_forms_admin.validation.form.name.min" satisfies FormsAdminAllKeys,
    1,
  ).max(
    64,
    "app_forms_admin.validation.form.name.max" satisfies FormsAdminAllKeys,
  ),
  notifications: formsNotificationSchema.optional(),
  fields: formsFieldsSchema,
  /** When true, only identified customers can submit (e.g. intake / gate-kept forms). */
  requireCustomerId: z.coerce.boolean<boolean>().optional(),
});

export const getFormSchemaWithUniqueCheck = (
  uniqueNameCheckFn: (name: string) => Promise<boolean>,
  message: string = "app_forms_admin.validation.form.name.unique" satisfies FormsAdminAllKeys,
) => {
  return formSchemaBase.superRefine(async (args, ctx) => {
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

export type FormUpdateModel = z.infer<typeof formSchemaBase>;

export type FormModel = Prettify<
  WithOrganizationId<
    WithDatabaseId<WithAppId<FormUpdateModel>> & {
      createdAt: Date;
      updatedAt: Date;
      isArchived?: boolean;
    }
  >
>;

export type FormListModel = Omit<FormModel, "fields" | "notifications"> & {
  responsesCount: number;
  lastResponse?: Date;
};

export const formAnswerValueSchema = z.union([
  z.string(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
]);

export const formAnswerSchema = z.object({
  name: zNonEmptyString("forms.answers.name.required", 1),
  label: zNonEmptyString("forms.answers.label.required", 1),
  type: z.custom<FormsFieldType>(),
  value: formAnswerValueSchema,
});

export type FormAnswer = z.infer<typeof formAnswerSchema>;

export const formResponseSchemaBase = z.object({
  formId: zNonEmptyString("forms.formId.required", 1),
  answers: z.record(z.string(), z.unknown()),
  url: z.string().optional(),
});

export type FormResponseUpdateModel = z.infer<typeof formResponseSchemaBase>;

export const updateFormResponseSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  customerId: z.string().nullable().optional(),
  url: z.string().optional(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
});

export type UpdateFormResponseModel = z.infer<typeof updateFormResponseSchema>;

export type UpdateFormResponseModelWithNormalizedAnswers = Omit<
  UpdateFormResponseModel,
  "answers"
> & {
  answers: FormAnswer[];
};

export type FormResponseModel = Prettify<
  WithOrganizationId<
    WithDatabaseId<WithAppId<UpdateFormResponseModelWithNormalizedAnswers>> & {
      createdAt: Date;
      updatedAt: Date;
      formId: string;
      customerId?: string;
      url?: string;
      ip?: string;
      userAgent?: string;
    }
  >
>;

export type FormResponseListModel = FormResponseModel & {
  customer?: Customer;
  formName?: string;
};

export const getFormsQuerySchema = querySchema.extend({
  priorityIds: z.array(zObjectId()).optional(),
  isArchived: z.array(z.coerce.boolean<boolean>()).optional(),
});

export type GetFormsQuery = z.infer<typeof getFormsQuerySchema>;

export const getFormResponsesQuerySchema = querySchema.extend({
  formId: z.array(zObjectId()).or(zObjectId()).optional(),
  customerId: z.array(zObjectId()).or(zObjectId()).optional(),
  range: dateRangeSchema.optional(),
});

export type GetFormResponsesQuery = z.infer<typeof getFormResponsesQuerySchema>;
