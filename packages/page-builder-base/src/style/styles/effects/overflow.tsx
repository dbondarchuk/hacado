import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { Crop } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const overflowKeys = ["visible", "hidden", "scroll", "auto", "clip"] as const;

const OverflowSchema = z.enum(overflowKeys);

export const overflowStyle = {
  name: "overflow",
  label: "builder.pageBuilder.styles.properties.overflow",
  category: "layout",
  icon: ({ className }) => <Crop className={className} />,
  schema: OverflowSchema,
  defaultValue: "visible",
  renderToCSS: (value) => {
    if (!value) return null;
    return `overflow: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");
    return (
      <Combobox
        values={overflowKeys.map((overflow) => ({
          value: overflow,
          label: t(`pageBuilder.styles.overflow.${overflow}`),
        }))}
        value={value}
        onItemSelect={(val) => onChange(val as z.infer<typeof OverflowSchema>)}
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof OverflowSchema>;
