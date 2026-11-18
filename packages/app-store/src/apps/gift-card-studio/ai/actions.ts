import type { GiftCardStudioAdminKeys } from "../translations/types";

export type GiftCardAiActionId =
  | "generate_design"
  | "refine_design"
  | "restyle"
  | "make_premium"
  | "make_festive"
  | "simplify"
  | "custom_instruction";

export type GiftCardAiAction = {
  id: GiftCardAiActionId;
  labelKey: GiftCardStudioAdminKeys;
  /** Default user-facing instruction when no custom text is provided. */
  message: string;
};

export const GIFT_CARD_AI_ACTIONS: GiftCardAiAction[] = [
  {
    id: "generate_design",
    labelKey: "designer.ai.actions.generateDesign",
    message:
      "Create a complete, polished gift card design for this canvas. Include a short design name, amount, code, to, and expiresAt fields with labels, a clear visual hierarchy, and a cohesive premium look.",
  },
  {
    id: "refine_design",
    labelKey: "designer.ai.actions.refineDesign",
    message:
      "Refine the current gift card design. Improve spacing, alignment, contrast, and hierarchy while keeping the same general style and required fields.",
  },
  {
    id: "restyle",
    labelKey: "designer.ai.actions.restyle",
    message:
      "Restyle the gift card with a fresh color palette, typography pairing, and background while preserving required amount and code fields and overall layout intent.",
  },
  {
    id: "make_premium",
    labelKey: "designer.ai.actions.makePremium",
    message:
      "Restyle this gift card toward a premium luxury look: restrained palette, elegant typography, generous margins, and refined decorative shapes.",
  },
  {
    id: "make_festive",
    labelKey: "designer.ai.actions.makeFestive",
    message:
      "Restyle this gift card for a festive celebratory feel while keeping text readable and required amount and code fields prominent.",
  },
  {
    id: "simplify",
    labelKey: "designer.ai.actions.simplify",
    message:
      "Simplify the gift card design. Remove clutter, reduce overlapping elements, and leave a clean layout with strong hierarchy and required fields.",
  },
  {
    id: "custom_instruction",
    labelKey: "designer.ai.actions.customInstruction",
    message: "Follow the user's custom instruction for this gift card design.",
  },
];

export function getGiftCardAiAction(
  actionId: string,
): GiftCardAiAction | undefined {
  return GIFT_CARD_AI_ACTIONS.find((action) => action.id === actionId);
}
