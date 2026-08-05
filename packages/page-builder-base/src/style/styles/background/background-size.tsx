import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { Maximize2 } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const options = ["auto", "cover", "contain", "initial", "inherit"] as const;
const BackgroundSizeSchema = z.enum(options);

export const backgroundSizeStyle = {
  name: "backgroundSize",
  label: "builder.pageBuilder.styles.properties.backgroundSize",
  category: "background",
  icon: ({ className }) => <Maximize2 className={className} />,
  schema: BackgroundSizeSchema,
  defaultValue: "auto",
  renderToCSS: (value) => {
    if (!value) return null;
    return `background-size: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");

    return (
      <Combobox
        value={value}
        onItemSelect={(value) => onChange(value as (typeof options)[number])}
        values={options.map((option) => ({
          value: option,
          label: t(`pageBuilder.styles.backgroundSize.${option}`),
        }))}
        size="sm"
        className="w-full"
      />
    );
  },
} as const satisfies StyleDefinition<typeof BackgroundSizeSchema>;
