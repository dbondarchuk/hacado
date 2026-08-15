import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { AlignLeft } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const textAlignKeys = ["left", "center", "right", "justify"] as const;
const TextAlignSchema = z.enum(textAlignKeys);

export const textAlignStyle = {
  name: "textAlign",
  label: "builder.pageBuilder.styles.properties.textAlign",
  category: "typography",
  schema: TextAlignSchema,
  icon: ({ className }) => <AlignLeft className={className} />,
  defaultValue: "left",
  renderToCSS: (value) => {
    if (!value) return null;
    return `text-align: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");
    return (
      <Combobox
        values={textAlignKeys.map((align) => ({
          value: align,
          shortLabel: t(`pageBuilder.styles.textAlign.${align}`),
          label: (
            <span style={{ textAlign: align }} className="w-full">
              {t(`pageBuilder.styles.textAlign.${align}`)}
            </span>
          ),
        }))}
        value={value}
        onItemSelect={(val) => onChange(val as z.infer<typeof TextAlignSchema>)}
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof TextAlignSchema>;
