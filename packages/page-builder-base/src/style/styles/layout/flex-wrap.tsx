import { useI18n } from "@timelish/i18n/client";
import { Combobox } from "@timelish/ui";
import { WrapText } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const flexWrapKeys = ["nowrap", "wrap", "wrap-reverse"] as const;

const FlexWrapSchema = z.enum(flexWrapKeys);

export const flexWrapStyle = {
  name: "flexWrap",
  label: "builder.pageBuilder.styles.properties.flexWrap",
  category: "layout",
  schema: FlexWrapSchema,
  icon: ({ className }) => <WrapText className={className} />,
  defaultValue: "nowrap",
  renderToCSS: (value) => {
    if (!value) return null;
    return `flex-wrap: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");

    return (
      <Combobox
        values={flexWrapKeys.map((wrap) => ({
          value: wrap,
          label: t(`pageBuilder.styles.flexWrap.${wrap}`),
        }))}
        value={value}
        onItemSelect={(val) => onChange(val as z.infer<typeof FlexWrapSchema>)}
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof FlexWrapSchema>;
