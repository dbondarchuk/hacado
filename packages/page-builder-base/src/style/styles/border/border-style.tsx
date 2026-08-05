import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { Square } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const borderStyleKeys = [
  "solid",
  "dashed",
  "dotted",
  "double",
  "groove",
  "ridge",
  "inset",
  "outset",
  "none",
  "hidden",
] as const;

const BorderStyleSchema = z.enum(borderStyleKeys);

export const borderStyleStyle = {
  name: "borderStyle",
  label: "builder.pageBuilder.styles.properties.borderStyle",
  category: "border",
  icon: ({ className }) => <Square className={className} />,
  schema: BorderStyleSchema,
  defaultValue: "solid",
  renderToCSS: (value) => {
    if (!value) return null;
    return `border-style: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");
    return (
      <Combobox
        values={borderStyleKeys.map((style) => ({
          value: style,
          label: t(`pageBuilder.styles.borderStyle.${style}`),
        }))}
        value={value}
        onItemSelect={(val) =>
          onChange(val as z.infer<typeof BorderStyleSchema>)
        }
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof BorderStyleSchema>;
