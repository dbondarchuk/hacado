import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { Italic } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const FontStyleSchema = z.enum(["normal", "italic", "oblique"]);

const fontStyleKeys = ["normal", "italic", "oblique"] as const;

export const fontStyleStyle = {
  name: "fontStyle",
  label: "builder.pageBuilder.styles.properties.fontStyle",
  category: "typography",
  schema: FontStyleSchema,
  icon: ({ className }) => <Italic className={className} />,
  defaultValue: "normal",
  renderToCSS: (value) => {
    if (!value) return null;
    return `font-style: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");
    return (
      <Combobox
        values={fontStyleKeys.map((style) => ({
          value: style,
          label: (
            <span style={{ fontStyle: style }}>
              {t(`pageBuilder.styles.fontStyle.${style}`)}
            </span>
          ),
        }))}
        value={value}
        onItemSelect={(val) => onChange(val as z.infer<typeof FontStyleSchema>)}
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof FontStyleSchema>;
