import { z } from "zod";

export const textMessageForwardingConfigurationSchema = z.object({
  defaultMemberId: z.string().optional(),
});

export type TextMessageForwardingConfiguration = z.infer<
  typeof textMessageForwardingConfigurationSchema
>;
