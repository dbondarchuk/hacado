import { BaseAllKeys, useI18n } from "@timelish/i18n/client";
import { Combobox } from "@timelish/ui";
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
}) =>
  ({
    name,
    label,
    category: "layout" as const,
    schema: GridLineSchema,
    icon: ({ className }: { className?: string }) => (
      <Icon className={className} />
    ),
    defaultValue: "auto" as const,
    renderToCSS: (value: GridLineValue | null | undefined) => {
      if (value === null || typeof value === "undefined") return null;
      return `${cssProperty}: ${value};`;
    },
    component: ({
      value,
      onChange,
    }: {
      value: GridLineValue;
      onChange: (value: GridLineValue) => void;
    }) => {
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
  }) as const satisfies StyleDefinition<typeof GridLineSchema>;
