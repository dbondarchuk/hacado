import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { AlignVerticalJustifyCenter } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const verticalAlignKeys = [
  "baseline",
  "sub",
  "super",
  "text-top",
  "text-bottom",
  "middle",
  "top",
  "bottom",
] as const;

const VerticalAlignSchema = z.enum(verticalAlignKeys);

export const verticalAlignStyle = {
  name: "verticalAlign",
  label: "builder.pageBuilder.styles.properties.verticalAlign",
  icon: ({ className }: { className?: string }) => (
    <AlignVerticalJustifyCenter className={className} />
  ),
  category: "layout" as const,
  schema: VerticalAlignSchema,
  defaultValue: "baseline",
  renderToCSS: (
    value: z.infer<typeof VerticalAlignSchema> | null | undefined,
  ) => {
    if (!value) return null;
    return `vertical-align: ${value};`;
  },
  component: ({
    value,
    onChange,
  }: {
    value: z.infer<typeof VerticalAlignSchema>;
    onChange: (value: z.infer<typeof VerticalAlignSchema>) => void;
  }) => {
    const t = useI18n("builder");
    return (
      <Combobox
        values={verticalAlignKeys.map((align) => ({
          value: align,
          label: t(`pageBuilder.styles.verticalAlign.${align}`),
        }))}
        value={value}
        onItemSelect={(val) =>
          onChange(val as z.infer<typeof VerticalAlignSchema>)
        }
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof VerticalAlignSchema>;
