import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { WrapText } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const overflowWrapKeys = ["normal", "break-word", "anywhere"] as const;

const overflowWrapKeyMap = {
  normal: "normal",
  "break-word": "break_word",
  anywhere: "anywhere",
} as const;

const OverflowWrapSchema = z.enum(overflowWrapKeys);

export const overflowWrapStyle = {
  name: "overflowWrap",
  label: "builder.pageBuilder.styles.properties.overflowWrap",
  category: "typography",
  icon: ({ className }) => <WrapText className={className} />,
  schema: OverflowWrapSchema,
  defaultValue: "normal",
  renderToCSS: (value) => {
    if (!value || value === "normal") return null;
    return `overflow-wrap: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");
    return (
      <Combobox
        values={overflowWrapKeys.map((overflowWrap) => ({
          value: overflowWrap,
          label: t(
            `pageBuilder.styles.overflowWrap.${overflowWrapKeyMap[overflowWrap]}`,
          ),
        }))}
        value={value}
        onItemSelect={(val) =>
          onChange(val as z.infer<typeof OverflowWrapSchema>)
        }
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof OverflowWrapSchema>;
