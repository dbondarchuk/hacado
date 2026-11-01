import { useI18n } from "@hacado/i18n/client";
import type { BaseAllKeys } from "@hacado/i18n/keys";
import { Combobox } from "@hacado/ui/combobox";
import { LucideIcon } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const gridLineNumbers = [
  -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
] as const;

export const GridLineSchema = z.union([
  z.literal("auto"),
  z.coerce.number<number>().int(),
]);

export type GridLineValue = z.infer<typeof GridLineSchema>;

const gridLineOptions: GridLineValue[] = ["auto", ...gridLineNumbers];

export const createGridLineStyle = <TName extends string>({
  name,
  label,
  cssProperty,
  icon: Icon,
}: {
  name: TName;
  label: BaseAllKeys;
  cssProperty: string;
  icon: LucideIcon;
}): StyleDefinition<typeof GridLineSchema, TName> => ({
  name,
  label,
  category: "layout",
  schema: GridLineSchema,
  icon: ({ className }: { className?: string }) => (
    <Icon className={className} />
  ),
  defaultValue: "auto",
  renderToCSS: (value) => {
    if (value === null || typeof value === "undefined") return null;

    return `${cssProperty}: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");

    return (
      <Combobox
        values={gridLineOptions.map((line) => ({
          value: String(line),
          label:
            line === "auto"
              ? t("pageBuilder.styles.keywords.auto")
              : String(line),
        }))}
        value={String(value ?? "auto")}
        onItemSelect={(val) =>
          onChange(val === "auto" ? "auto" : (Number(val) as GridLineValue))
        }
        className="w-full"
        size="sm"
      />
    );
  },
});
