import { useI18n } from "@timelish/i18n/client";
import { Combobox } from "@timelish/ui";
import { Scissors } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const options = [
  "border-box",
  "padding-box",
  "content-box",
  "text",
  "initial",
  "inherit",
] as const;
const BackgroundClipSchema = z.enum(options);

export const backgroundClipStyle = {
  name: "backgroundClip",
  label: "builder.pageBuilder.styles.properties.backgroundClip",
  category: "background",
  icon: ({ className }) => <Scissors className={className} />,
  schema: BackgroundClipSchema,
  defaultValue: "border-box",
  renderToCSS: (value) => {
    if (!value) return null;
    return `background-clip: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");

    return (
      <Combobox
        value={value}
        onItemSelect={(value) => onChange(value as (typeof options)[number])}
        values={options.map((option) => ({
          value: option,
          label: t(`pageBuilder.styles.backgroundClip.${option}`),
        }))}
        size="sm"
        className="w-full"
      />
    );
  },
} as const satisfies StyleDefinition<typeof BackgroundClipSchema>;
