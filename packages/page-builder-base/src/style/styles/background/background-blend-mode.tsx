import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { Palette } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const options = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
  "initial",
  "inherit",
] as const;
const BackgroundBlendModeSchema = z.enum(options);

export const backgroundBlendModeStyle = {
  name: "backgroundBlendMode",
  label: "builder.pageBuilder.styles.properties.backgroundBlendMode",
  category: "background",
  icon: ({ className }) => <Palette className={className} />,
  schema: BackgroundBlendModeSchema,
  defaultValue: "normal",
  renderToCSS: (value) => {
    if (!value) return null;
    return `background-blend-mode: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");

    return (
      <Combobox
        value={value}
        onItemSelect={(value) => onChange(value as (typeof options)[number])}
        values={options.map((option) => ({
          value: option,
          label: t(`pageBuilder.styles.backgroundBlendMode.${option}`),
        }))}
        size="sm"
        className="w-full"
      />
    );
  },
} as const satisfies StyleDefinition<typeof BackgroundBlendModeSchema>;
