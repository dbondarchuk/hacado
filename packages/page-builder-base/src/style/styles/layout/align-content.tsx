import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { AlignVerticalSpaceBetween } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const alignContentKeys = [
  "flex-start",
  "flex-end",
  "center",
  "space-between",
  "space-around",
  "space-evenly",
  "stretch",
] as const;

const AlignContentSchema = z.enum(alignContentKeys);

export const alignContentStyle = {
  name: "alignContent",
  label: "builder.pageBuilder.styles.properties.alignContent",
  category: "layout",
  schema: AlignContentSchema,
  icon: ({ className }) => <AlignVerticalSpaceBetween className={className} />,
  defaultValue: "stretch",
  renderToCSS: (value) => {
    if (!value) return null;
    return `align-content: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");

    return (
      <Combobox
        values={alignContentKeys.map((align) => ({
          value: align,
          label: t(`pageBuilder.styles.alignContent.${align}`),
        }))}
        value={value}
        onItemSelect={(val) =>
          onChange(val as z.infer<typeof AlignContentSchema>)
        }
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof AlignContentSchema>;
