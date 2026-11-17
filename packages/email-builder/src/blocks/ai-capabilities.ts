import type { EditorBlockAICapability } from "@hacado/builder/types";

/** Email-builder pack for text / heading / copy blocks. */
export const TEXT_AI_CAPABILITIES: EditorBlockAICapability[] = [
  {
    id: "rewrite",
    label: "Rewrite",
    labelKey: "builder.ai.blockActions.rewrite",
    description: "Rewrite the selected content",
    kind: "generative",
  },
  {
    id: "improve_clarity",
    label: "Improve clarity",
    labelKey: "builder.ai.blockActions.improveClarity",
    description: "Make the writing clearer",
    kind: "generative",
  },
  {
    id: "change_tone",
    label: "Change tone",
    labelKey: "builder.ai.blockActions.changeTone",
    description: "Adjust the tone of the text",
    kind: "generative",
    options: [
      {
        id: "change_tone_professional",
        label: "Professional",
        labelKey: "builder.ai.blockActions.tones.professional",
        message: "Change the tone to professional",
      },
      {
        id: "change_tone_friendly",
        label: "Friendly",
        labelKey: "builder.ai.blockActions.tones.friendly",
        message: "Change the tone to friendly",
      },
      {
        id: "change_tone_casual",
        label: "Casual",
        labelKey: "builder.ai.blockActions.tones.casual",
        message: "Change the tone to casual",
      },
      {
        id: "change_tone_formal",
        label: "Formal",
        labelKey: "builder.ai.blockActions.tones.formal",
        message: "Change the tone to formal",
      },
      {
        id: "change_tone_confident",
        label: "Confident",
        labelKey: "builder.ai.blockActions.tones.confident",
        message: "Change the tone to confident",
      },
      {
        id: "change_tone_empathetic",
        label: "Empathetic",
        labelKey: "builder.ai.blockActions.tones.empathetic",
        message: "Change the tone to empathetic",
      },
    ],
  },
  {
    id: "expand",
    label: "Expand",
    labelKey: "builder.ai.blockActions.expand",
    description: "Expand the content",
    kind: "generative",
  },
  {
    id: "shorten",
    label: "Shorten",
    labelKey: "builder.ai.blockActions.shorten",
    description: "Make the content shorter",
    kind: "generative",
  },
];

/** Email-builder pack for image / avatar blocks. */
export const IMAGE_AI_CAPABILITIES: EditorBlockAICapability[] = [
  {
    id: "write_alt_text",
    label: "Write alt text",
    labelKey: "builder.ai.blockActions.writeAltText",
    description: "Generate accessible alt text",
    kind: "generative",
  },
  {
    id: "replace_image",
    label: "Replace image",
    labelKey: "builder.ai.blockActions.replaceImage",
    description: "Find or generate a replacement image",
    kind: "generative",
  },
];

/** Email-builder pack for layout / container blocks. */
export const LAYOUT_AI_CAPABILITIES: EditorBlockAICapability[] = [
  {
    id: "improve_layout",
    label: "Improve layout",
    labelKey: "builder.ai.blockActions.improveLayout",
    description: "Suggest layout and spacing improvements",
    kind: "generative",
  },
  {
    id: "adjust_spacing",
    label: "Adjust spacing",
    labelKey: "builder.ai.blockActions.adjustSpacing",
    description: "Improve spacing consistency",
    kind: "generative",
  },
];
