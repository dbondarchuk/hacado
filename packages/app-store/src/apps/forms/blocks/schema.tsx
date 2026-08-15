import { EditorDocumentBlocksDictionary } from "@hacado/builder";
import { AllKeys } from "@hacado/i18n";
import { FileInput } from "lucide-react";
import { FormsAdminKeys, FormsAdminNamespace } from "../translations/types";
import {
  FormBlockConfiguration,
  FormBlockEditor,
  FormBlockPropsDefaults,
  FormBlockPropsSchema,
} from "./form";

export const FormsBlocksSchema = {
  Form: FormBlockPropsSchema,
};

export const FormsBlocksAllowedInFooter = {
  Form: false,
};

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
