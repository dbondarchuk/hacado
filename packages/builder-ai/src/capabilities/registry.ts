import type { BlockAICapability } from "../types";

const GENERIC_TEXT_CAPABILITIES: BlockAICapability[] = [
  {
    id: "rewrite",
    label: "Rewrite",
    description: "Rewrite the selected content",
    kind: "generative",
  },
  {
    id: "improve_clarity",
    label: "Improve clarity",
    description: "Make the writing clearer",
    kind: "generative",
  },
  {
    id: "change_tone",
    label: "Change tone",
    description: "Adjust the tone of the text",
    kind: "generative",
  },
  {
    id: "expand",
    label: "Expand",
    description: "Expand the content",
    kind: "generative",
  },
  {
    id: "shorten",
    label: "Shorten",
    description: "Make the content shorter",
    kind: "generative",
  },
];

const IMAGE_CAPABILITIES: BlockAICapability[] = [
  {
    id: "write_alt_text",
    label: "Write alt text",
    description: "Generate accessible alt text",
    kind: "generative",
  },
  {
    id: "replace_image",
    label: "Replace image",
    description: "Find or generate a replacement image",
    kind: "generative",
  },
  {
    id: "rotate_90",
    label: "Rotate 90°",
    description: "Rotate the image by 90 degrees",
    kind: "deterministic",
  },
];

const LAYOUT_CAPABILITIES: BlockAICapability[] = [
  {
    id: "improve_layout",
    label: "Improve layout",
    description: "Suggest layout and spacing improvements",
    kind: "generative",
  },
  {
    id: "adjust_spacing",
    label: "Adjust spacing",
    description: "Improve spacing consistency",
    kind: "generative",
  },
];

const byType = new Map<string, BlockAICapability[]>();
const byCapabilityTag = new Map<string, BlockAICapability[]>([
  ["text", GENERIC_TEXT_CAPABILITIES],
  ["image", IMAGE_CAPABILITIES],
  ["layout", LAYOUT_CAPABILITIES],
]);

export function registerBlockAICapabilities(
  blockType: string,
  capabilities: BlockAICapability[],
) {
  byType.set(blockType, capabilities);
}

export function getRegisteredBlockAICapabilities(input: {
  blockType: string;
  tags?: string[];
  capabilities?: string[];
}): BlockAICapability[] {
  const exact = byType.get(input.blockType);
  if (exact) return exact;

  const tags = new Set([
    ...(input.tags ?? []),
    ...(input.capabilities ?? []),
    input.blockType.toLowerCase(),
  ]);

  if (
    tags.has("image") ||
    input.blockType.toLowerCase().includes("image")
  ) {
    return IMAGE_CAPABILITIES;
  }

  if (
    tags.has("text") ||
    tags.has("heading") ||
    tags.has("paragraph") ||
    input.blockType.toLowerCase().includes("text") ||
    input.blockType.toLowerCase().includes("heading")
  ) {
    return GENERIC_TEXT_CAPABILITIES;
  }

  if (
    tags.has("layout") ||
    tags.has("container") ||
    input.blockType.toLowerCase().includes("container") ||
    input.blockType.toLowerCase().includes("layout")
  ) {
    return LAYOUT_CAPABILITIES;
  }

  return [
    {
      id: "custom_instruction",
      label: "Ask AI",
      description: "Run a custom instruction on this block",
      kind: "generative",
    },
  ];
}

export function listCapabilityTags() {
  return [...byCapabilityTag.keys()];
}
