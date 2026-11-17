import { EditorDocumentBlocksDictionary } from "@hacado/builder/types";
import { AllKeys } from "@hacado/i18n";
import { FileInput } from "lucide-react";
import { FormsAdminKeys, FormsAdminNamespace } from "../translations/types";
import { FormsBlocksAllowedInFooter, FormsBlocksSchema } from "./block-schemas";
import {
  FormBlockConfiguration,
  FormBlockEditor,
  FormBlockPropsDefaults,
} from "./form";

export { FormsBlocksAllowedInFooter, FormsBlocksSchema };

export const FormsBlocksDefaultMetadata = (
  _appName: string,
  appId: string,
): Record<string, unknown> => ({
  formsAppId: appId,
});

export const FormsEditors: EditorDocumentBlocksDictionary<
  typeof FormsBlocksSchema
> = {
  Form: {
    displayName: "app_forms_admin.block.displayName" satisfies AllKeys<
      FormsAdminNamespace,
      FormsAdminKeys
    >,
    icon: <FileInput />,
    Configuration: FormBlockConfiguration,
    Editor: FormBlockEditor,
    defaultValue: FormBlockPropsDefaults,
    category: "app_forms_admin.block.category" satisfies AllKeys<
      FormsAdminNamespace,
      FormsAdminKeys
    >,
    capabilities: ["block", "form"],
    tags: ["form"],
    // App-owned AI actions — declare on the block instead of the central registry.
    aiCapabilities: [
      {
        id: "improve_form_copy",
        label: "Improve form copy",
        labelKey: "app_forms_admin.block.ai.improveFormCopy" satisfies AllKeys<
          FormsAdminNamespace,
          FormsAdminKeys
        >,
        description: "Improve field labels, placeholders, and helper text",
        kind: "generative",
      },
      {
        id: "custom_instruction",
        label: "Ask AI",
        labelKey: "app_forms_admin.block.ai.askAi" satisfies AllKeys<
          FormsAdminNamespace,
          FormsAdminKeys
        >,
        description: "Run a custom instruction on this form block",
        kind: "generative",
      },
    ],
  },
};

type FormsBlocksType = {
  [K in keyof typeof FormsBlocksSchema]: {
    schema: (typeof FormsBlocksSchema)[K];
    editor: (typeof FormsEditors)[K];
    allowedInFooter: (typeof FormsBlocksAllowedInFooter)[K];
    defaultMetadata: (
      appName: string,
      appId: string,
    ) => Record<string, unknown>;
  };
};

export const FormsBlocks = Object.fromEntries(
  Object.entries(FormsBlocksSchema).map(([key, schema]) => [
    key,
    {
      schema,
      editor: FormsEditors[key as keyof typeof FormsBlocksSchema],
      allowedInFooter:
        FormsBlocksAllowedInFooter[key as keyof typeof FormsBlocksSchema],
      defaultMetadata: FormsBlocksDefaultMetadata,
    },
  ]),
) as FormsBlocksType;
