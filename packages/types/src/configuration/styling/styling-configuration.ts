import * as z from "zod";

import { zUniqueArray } from "../../utils";
import { resourceSchema } from "../resources";
import { fontName } from "./fonts-catalog";
import { colorOverrideSchema } from "./styling";

export const stylingConfigurationSchema = z.object({
  colors: zUniqueArray(
    colorOverrideSchema.array(),
    (item) => item.type,
    "configuration.styling.colors.unique",
  ).optional(),
  fonts: z
    .object({
      primary: fontName.optional(),
      secondary: fontName.optional(),
      tertiary: fontName.optional(),
    })
    .optional(),
  css: z.array(resourceSchema).optional(),
});

export type StylingConfiguration = z.infer<typeof stylingConfigurationSchema>;
