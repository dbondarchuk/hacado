import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { AlignHorizontalJustifyCenter } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const justifyItemsKeys = ["start", "end", "center", "stretch"] as const;

const JustifyItemsSchema = z.enum(justifyItemsKeys);

export const justifyItemsStyle = {
  name: "justifyItems",
  label: "builder.pageBuilder.styles.properties.justifyItems",
  category: "layout",
  schema: JustifyItemsSchema,
  icon: ({ className }) => (
    <AlignHorizontalJustifyCenter className={className} />
  ),
  defaultValue: "stretch",
  renderToCSS: (value) => {
    if (!value) return null;
    return `justify-items: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");

    return (
      <Combobox
        values={justifyItemsKeys.map((justify) => ({
          value: justify,
          label: t(`pageBuilder.styles.justifyItems.${justify}`),
        }))}
        value={value}
        onItemSelect={(val) =>
          onChange(val as z.infer<typeof JustifyItemsSchema>)
        }
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof JustifyItemsSchema>;
