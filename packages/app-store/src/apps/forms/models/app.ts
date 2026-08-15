import { zNonEmptyString, zObjectId, zTaggedUnion } from "@hacado/types";
import * as z from "zod";
import {
  formSchemaBase,
  getFormResponsesQuerySchema,
  getFormsQuerySchema,
  updateFormResponseSchema,
} from "./form";

export const getFormResponseByIdActionSchema = z.object({
  id: zObjectId(),
});

export type GetFormResponseByIdAction = z.infer<
  typeof getFormResponseByIdActionSchema
>;
export const GetFormResponseByIdActionType =
  "forms-get-form-response-by-id" as const;

export const updateFormResponseActionSchema = z.object({
  id: zObjectId(),
  update: updateFormResponseSchema,
});

export type UpdateFormResponseAction = z.infer<
  typeof updateFormResponseActionSchema
>;
export const UpdateFormResponseActionType =
  "forms-update-form-response" as const;

export const deleteFormResponseActionSchema = z.object({
  id: zObjectId(),
});

export type DeleteFormResponseAction = z.infer<
  typeof deleteFormResponseActionSchema
>;
export const DeleteFormResponseActionType =
  "forms-delete-form-response" as const;

export const deleteSelectedFormResponsesActionSchema = z.object({
  ids: z.array(zObjectId()),
});

export type DeleteSelectedFormResponsesAction = z.infer<
  typeof deleteSelectedFormResponsesActionSchema
>;
export const DeleteSelectedFormResponsesActionType =
  "forms-delete-selected-form-responses" as const;

export const createFormActionSchema = z.object({
  form: formSchemaBase,
});

export type CreateFormAction = z.infer<typeof createFormActionSchema>;
export const CreateFormActionType = "forms-create-form" as const;

export const updateFormActionSchema = z.object({
  id: zObjectId(),
  form: formSchemaBase,
});

export type UpdateFormAction = z.infer<typeof updateFormActionSchema>;
export const UpdateFormActionType = "forms-update-form" as const;

export const deleteFormActionSchema = z.object({
  id: zObjectId(),
});

export type DeleteFormAction = z.infer<typeof deleteFormActionSchema>;
export const DeleteFormActionType = "forms-delete-form" as const;

export const deleteSelectedFormsActionSchema = z.object({
  ids: z.array(zObjectId()),
});

export type DeleteSelectedFormsAction = z.infer<
  typeof deleteSelectedFormsActionSchema
>;
export const DeleteSelectedFormsActionType =
  "forms-delete-selected-forms" as const;

export const setFormArchivedActionSchema = z.object({
  id: zObjectId(),
  isArchived: z.coerce.boolean<boolean>(),
});

export type SetFormArchivedAction = z.infer<typeof setFormArchivedActionSchema>;
export const SetFormArchivedActionType = "forms-set-form-archived" as const;

export const setFormsArchivedActionSchema = z.object({
  ids: z.array(zObjectId()),
  isArchived: z.coerce.boolean<boolean>(),
});

export type SetFormsArchivedAction = z.infer<
  typeof setFormsArchivedActionSchema
>;
export const SetFormsArchivedActionType = "forms-set-forms-archived" as const;

export const getFormsActionSchema = z.object({
  query: getFormsQuerySchema,
});

export type GetFormsAction = z.infer<typeof getFormsActionSchema>;
export const GetFormsActionType = "forms-get-forms" as const;

export const getFormByIdActionSchema = z.object({
  id: zObjectId(),
});

export type GetFormByIdAction = z.infer<typeof getFormByIdActionSchema>;
export const GetFormByIdActionType = "forms-get-form" as const;

export const getFormResponsesActionSchema = z.object({
  query: getFormResponsesQuerySchema,
});

export type GetFormResponsesAction = z.infer<
  typeof getFormResponsesActionSchema
>;
export const GetFormResponsesActionType = "forms-get-responses" as const;

export const checkFormNameUniqueActionSchema = z.object({
  name: zNonEmptyString(),
  id: zObjectId().optional(),
});

export type CheckFormNameUniqueAction = z.infer<
  typeof checkFormNameUniqueActionSchema
>;
export const CheckFormNameUniqueActionType = "forms-check-name-unique" as const;

export const markFormResponsesReadActionSchema = z.object({});

export type MarkFormResponsesReadAction = z.infer<
  typeof markFormResponsesReadActionSchema
>;
export const MarkFormResponsesReadActionType =
  "forms-mark-responses-read" as const;

export const createFormResponseActionSchema = z.object({
  formId: zObjectId(),
  update: updateFormResponseSchema,
});

export type CreateFormResponseAction = z.infer<
  typeof createFormResponseActionSchema
>;
export const CreateFormResponseActionType = "forms-create-response" as const;

export const reassignFormResponsesActionSchema = z.object({
  ids: z.array(zObjectId()),
  customerId: zObjectId().nullable(),
});

export type ReassignFormResponsesAction = z.infer<
  typeof reassignFormResponsesActionSchema
>;
export const ReassignFormResponsesActionType =
  "forms-reassign-form-responses" as const;

export const requestActionSchema = zTaggedUnion([
  { type: CreateFormActionType, data: createFormActionSchema },
  { type: UpdateFormActionType, data: updateFormActionSchema },
  { type: DeleteFormActionType, data: deleteFormActionSchema },
  { type: GetFormsActionType, data: getFormsActionSchema },
  { type: GetFormByIdActionType, data: getFormByIdActionSchema },
  { type: GetFormResponsesActionType, data: getFormResponsesActionSchema },
  { type: CreateFormResponseActionType, data: createFormResponseActionSchema },
  {
    type: GetFormResponseByIdActionType,
    data: getFormResponseByIdActionSchema,
  },
  { type: UpdateFormResponseActionType, data: updateFormResponseActionSchema },
  { type: DeleteFormResponseActionType, data: deleteFormResponseActionSchema },
  {
    type: DeleteSelectedFormsActionType,
    data: deleteSelectedFormsActionSchema,
  },
  {
    type: DeleteSelectedFormResponsesActionType,
    data: deleteSelectedFormResponsesActionSchema,
  },
  {
    type: ReassignFormResponsesActionType,
    data: reassignFormResponsesActionSchema,
  },
  { type: SetFormArchivedActionType, data: setFormArchivedActionSchema },
  { type: SetFormsArchivedActionType, data: setFormsArchivedActionSchema },
  {
    type: CheckFormNameUniqueActionType,
    data: checkFormNameUniqueActionSchema,
  },
  {
    type: MarkFormResponsesReadActionType,
    data: markFormResponsesReadActionSchema,
  },
]);

export type RequestAction = z.infer<typeof requestActionSchema>;
