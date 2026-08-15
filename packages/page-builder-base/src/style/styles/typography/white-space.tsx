import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { WrapText } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const whiteSpaceKeys = [
  "normal",
  "nowrap",
  "pre",
  "pre-wrap",
  "pre-line",
  "break-spaces",
] as const;

const whiteSpaceKeyMap = {
  normal: "normal",
  nowrap: "nowrap",
  pre: "pre",
  "pre-wrap": "pre_wrap",
  "pre-line": "pre_line",
  "break-spaces": "break_spaces",
} as const;

const WhiteSpaceSchema = z.enum(whiteSpaceKeys);

export const whiteSpaceStyle = {
  name: "whiteSpace",
  label: "builder.pageBuilder.styles.properties.whiteSpace",
  category: "typography",
  icon: ({ className }) => <WrapText className={className} />,
  schema: WhiteSpaceSchema,
  defaultValue: "normal",
  renderToCSS: (value) => {
    if (!value || value === "normal") return null;
    return `white-space: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");
    return (
      <Combobox
        values={whiteSpaceKeys.map((whiteSpace) => ({
          value: whiteSpace,
          label: t(
            `pageBuilder.styles.whiteSpace.${whiteSpaceKeyMap[whiteSpace]}`,
          ),
        }))}
        value={value}
        onItemSelect={(val) =>
          onChange(val as z.infer<typeof WhiteSpaceSchema>)
        }
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof WhiteSpaceSchema>;
