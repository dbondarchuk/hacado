import * as z from "zod";
import { communicationChannels } from "../communication";
import { WithDatabaseId, WithOrganizationId } from "../database";
import { Prettify, zNonEmptyString } from "../utils";

/** Template schema for template creation and update */
export const templateSchema = z
  .object({
    name: zNonEmptyString(
      "validation.template.name.required",
      3,
      256,
      "validation.template.name.max",
    ),
  })
  .and(
    z.discriminatedUnion("type", [
      z.object({
        type: z
          .enum(communicationChannels)
          .extract(["email"], { message: "validation.template.type.invalid" }),
        subject: zNonEmptyString(
          "validation.template.value.subject.required",
          1,
          256,
          "validation.template.value.subject.max",
        ),
        value: z.any(),
      }),
      z.object({
        // Platform US/CA sends ignore this stored body. Keep the documents so a
        // later non-US/Canada editor can read them again.
        type: z.enum(communicationChannels).extract(["text-message"], {
          message: "validation.template.type.invalid",
        }),
        value: zNonEmptyString(
          "validation.template.textMessage.value.required",
          1,
          500,
          "validation.template.textMessage.value.max",
        ),
      }),
    ]),
  );

/** Gets template schema with unique name check
 * @param uniqueNameCheckFn - Function to check if the template name is unique
 * @param message - Message to display if the template name is not unique
 * @returns Template schema with unique name check
 */
export const getTemplateSchemaWithUniqueCheck = (
  uniqueNameCheckFn: (name: string) => Promise<boolean> | boolean,
  message: string,
) => {
  return templateSchema.superRefine(async (args, ctx) => {
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

/** Template update model (used for creating and updating templates) */
export type TemplateUpdateModel = z.infer<typeof templateSchema>;

/** Communication template */
export type Template = Prettify<
  WithOrganizationId<WithDatabaseId<TemplateUpdateModel>> & {
    updatedAt: Date;
  }
>;

/** Template list model (used for listing templates) */
export type TemplateListModel = Omit<Template, "value">;

/** Templates template (used for templates in the admin panel) */
export type TemplatesTemplate = TemplateUpdateModel;

/** Template templates list (used for listing templates in the admin panel) */
export type TemplateTemplatesList = {
  [id: string]: {
    [language: string]: TemplatesTemplate;
  };
};
