import { EditorDocumentBlocksDictionary } from "@hacado/builder";
import { AllKeys, BuilderKeys } from "@hacado/i18n";
import { UserRound } from "lucide-react";
import { MyCabinetAdminAllKeys } from "../translations/types";
import {
  MyCabinetBlockConfiguration,
  MyCabinetBlockEditor,
  MyCabinetBlockPropsDefaults,
  MyCabinetBlockPropsSchema,
} from "./my-cabinet";

export const MyCabinetBlocksSchema = {
  MyCabinet: MyCabinetBlockPropsSchema,
};

export const MyCabinetEditors: EditorDocumentBlocksDictionary<
  typeof MyCabinetBlocksSchema
> = {
  MyCabinet: {
    displayName:
      "app_my-cabinet_admin.block.displayName" satisfies MyCabinetAdminAllKeys,
    icon: <UserRound />,
    Configuration: MyCabinetBlockConfiguration,
    Editor: MyCabinetBlockEditor,
    defaultValue: MyCabinetBlockPropsDefaults,
    category: "builder.pageBuilder.blocks.categories.booking" satisfies AllKeys<
      "builder",
      BuilderKeys
    >,
    capabilities: ["block", "appointments"],
    tags: ["cabinet", "appointments"],
  },
};

export const MyCabinetBlocks = {
  MyCabinet: {
    schema: MyCabinetBlocksSchema.MyCabinet,
    editor: MyCabinetEditors.MyCabinet,
    defaultMetadata: (_appName: string, appId: string) => ({
      myCabinetAppId: appId,
    }),
    allowedInFooter: false,
  },
};
