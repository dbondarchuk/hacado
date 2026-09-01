import { AllKeys, I18nFn } from "@hacado/i18n";
import * as z from "zod";
import { TEditorBlock } from "./editor/core";

export type BaseZodDictionary = {
  [name: string]: z.ZodTypeAny;
};

import type { SelectedSlotRef } from "./embedded-slot";

export type ConfigurationProps<T> = {
  data: T;
  setData: (data: T) => void;
  base: BaseBlockProps | undefined;
  onBaseChange: (base: BaseBlockProps) => void;
  metadata: Record<string, any> | undefined;
  onMetadataChange: (metadata: Record<string, any> | undefined) => void;
  /** Set when the user selected an embedded slot on this block (not a child block). */
  selectedSlot?: SelectedSlotRef | null;
};

export type BaseBlockProps = {
  id?: string;
  className?: string;
};

export type BlockFilterRule = {
  type?: string[];
  tags?: string[];
  capabilities?: string[];

  not?: {
    type?: string[];
    tags?: string[];
    capabilities?: string[];
  };
};

export type BlockFilterRuleResult = BlockFilterRule | "impossible";

export type EditorProps<T> = T;

export type BuilderSchema = BaseZodDictionary;

export type BlockEditorDisableOptions = {
  keyboardShortcuts?: {
    moveUp?: boolean;
    moveDown?: boolean;
    delete?: boolean;
    pasteImage?: boolean;
    undoRedo?: boolean;
  };
};

export type TemplateDefinition = {
  displayName: AllKeys;
  icon: React.ReactNode;
  category: AllKeys;
  /** Optional thumbnail URL shown in the templates panel. */
  previewImage?: string;
  getBlock: (t: I18nFn<undefined, undefined>) => TEditorBlock;
};

export type TemplatesConfiguration = Record<string, TemplateDefinition>;

export type EditorDocumentBlocksDictionary<T extends BuilderSchema = any> = {
  [K in keyof T]: {
    displayName: AllKeys;
    icon: React.ReactNode;
    Editor: React.ComponentType<EditorProps<z.infer<T[K]>>>;
    Configuration: React.ComponentType<ConfigurationProps<z.infer<T[K]>>>;
    Toolbar?: React.ComponentType<ConfigurationProps<z.infer<T[K]>>>;
    defaultValue:
      | z.infer<T[K]>
      | (() => z.infer<T[K]>)
      | ((t: I18nFn<undefined, undefined>) => z.infer<T[K]>);
    category: AllKeys;
    allowedIn?: BlockFilterRule;
    /** When true, block is omitted from the blocks panel (e.g. child-only or template-only blocks). */
    hideInBlocksPanel?: boolean;
    tags?: string[];
    capabilities?: string[];
    disable?: BlockEditorDisableOptions;
    defaultMetadata?: Record<string, any>;
  };
};

export type BlockConfiguration<T extends BuilderSchema> = {
  [TType in keyof T]: {
    type: TType;
    data: z.infer<T[TType]>;
  };
}[keyof T];

// export function buildBlockConfigurationSchema<T extends BuilderSchema>(
//   blocks: BuilderSchema
// ) {
//   const blockObjects = Object.keys(blocks).map((type: keyof T) =>
//     z.object({
//       type: z.literal(type),
//       data: blocks[type],
//     })
//   );

//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   return z
//     .discriminatedUnion("type", blockObjects as any)
//     .transform((v) => v as BlockConfiguration<T>);
// }

export function buildBlockConfigurationDictionary<T extends BaseZodDictionary>(
  blocks: EditorDocumentBlocksDictionary<T>,
) {
  return blocks;
}
