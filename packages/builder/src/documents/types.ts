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

export type LayoutTemplateService = {
  id: string;
  name: string;
  /** Plain-text description for layout composers. */
  description: string;
  slug: string;
  pageSlug: string;
  imageUrl?: string;
};

export type LayoutTemplateContext = {
  services?: LayoutTemplateService[];
};

type TemplateDefinitionBase = {
  displayName: AllKeys;
  icon: React.ReactNode;
  category: AllKeys;
  /** Optional thumbnail URL shown in the templates panel. */
  previewImage?: string;
  // Optional list of builder targets (eg. 'page', 'footer') where this template can be used.
  allowedBuilderTypes?: string[];
};

/** Single-root section composite (drag onto the canvas). */
export type SectionTemplateDefinition = TemplateDefinitionBase & {
  kind?: "section";
  getBlock: (t: I18nFn<undefined, undefined>) => TEditorBlock;
};

/**
 * Multi-block layout template (click to replace root children).
 * Lives in the base builder so non-page editors can reuse it.
 * `layoutKind` is an opaque string - domain-specific values live in consumers.
 */
export type LayoutTemplateDefinition = TemplateDefinitionBase & {
  kind: "layout";
  layoutKind: string;
  packId: string;
  getBlocks: (
    t: I18nFn<undefined, undefined>,
    ctx?: LayoutTemplateContext,
  ) => TEditorBlock[];
};

export type TemplateDefinition =
  | SectionTemplateDefinition
  | LayoutTemplateDefinition;

export type TemplatesConfiguration = Record<string, TemplateDefinition>;

export function isLayoutTemplate(
  template: TemplateDefinition,
): template is LayoutTemplateDefinition {
  return template.kind === "layout";
}

export function isSectionTemplate(
  template: TemplateDefinition,
): template is SectionTemplateDefinition {
  return template.kind !== "layout";
}

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
    /** Optional list of builder targets (eg. 'page', 'footer') where this block can be used. */
    allowedBuilderTypes?: string[];
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
