import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { AlignVerticalSpaceAround } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const alignSelfKeys = [
  "auto",
  "flex-start",
  "flex-end",
  "center",
  "baseline",
  "stretch",
] as const;

const AlignSelfSchema = z.enum(alignSelfKeys);

export const alignSelfStyle = {
  name: "alignSelf",
  label: "builder.pageBuilder.styles.properties.alignSelf",
  category: "layout",
  schema: AlignSelfSchema,
  icon: ({ className }) => <AlignVerticalSpaceAround className={className} />,
  defaultValue: "auto",
  renderToCSS: (value) => {
    if (!value || value === "auto") return null;
    return `align-self: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");

    return (
      <Combobox
        values={alignSelfKeys.map((align) => ({
          value: align,
          label: t(`pageBuilder.styles.alignSelf.${align}`),
        }))}
        value={value}
        onItemSelect={(val) => onChange(val as z.infer<typeof AlignSelfSchema>)}
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof AlignSelfSchema>;
