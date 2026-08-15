import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { Underline } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const textDecorationKeys = [
  "none",
  "underline",
  "overline",
  "line-through",
] as const;

const TextDecorationSchema = z.enum(textDecorationKeys);

export const textDecorationStyle = {
  name: "textDecoration",
  label: "builder.pageBuilder.styles.properties.textDecoration",
  category: "typography",
  icon: ({ className }) => <Underline className={className} />,
  schema: TextDecorationSchema,
  defaultValue: "none",
  renderToCSS: (value) => {
    if (!value) return null;
    return `text-decoration: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");
    return (
      <Combobox
        values={textDecorationKeys.map((decoration) => ({
          value: decoration,
          label: t(`pageBuilder.styles.textDecoration.${decoration}`),
        }))}
        value={value}
        onItemSelect={(val) =>
          onChange(val as z.infer<typeof TextDecorationSchema>)
        }
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof TextDecorationSchema>;
