import { RawDoubleNumberInput } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { Combobox } from "@timelish/ui";
import { Proportions } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const predefinedOptions = ["initial", "inherit", "unset"] as const;

// Schema for custom X/Y coordinates
const CustomAspectRatioSchema = z.object({
  x: z.number().min(1).max(100).optional().nullable(),
  y: z.number().min(1).max(100).optional().nullable(),
});

// Union schema for both predefined and custom values
const AspectRatioSchema = z.union([
  z.enum(predefinedOptions),
  CustomAspectRatioSchema,
]);

type AspectRatioValue = z.infer<typeof AspectRatioSchema>;

export const aspectRatioStyle = {
  name: "aspectRatio",
  label: "builder.pageBuilder.styles.properties.aspectRatio",
  category: "layout",
  icon: ({ className }) => <Proportions className={className} />,
  schema: AspectRatioSchema,
  defaultValue: "square" as AspectRatioValue,
  renderToCSS: (value) => {
    if (!value) return null;

    if (typeof value === "string") {
      return `aspect-ratio: ${value};`;
    }

    if (typeof value === "object" && value !== null) {
      const x = value.x ?? 1;
      const y = value.y ?? 1;
      return `aspect-ratio: ${x} / ${y};`;
    }

    return null;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");

    // Determine if current value is custom or predefined
    const isCustom = typeof value === "object" && value !== null;

    const handlePredefinedChange = (newValue: string) => {
      if (newValue === "custom") {
        onChange({ x: 1, y: 1 });
      } else {
        onChange(newValue as (typeof predefinedOptions)[number]);
      }
    };

    const handleCustomChange = (field: "x" | "y", newValue: number | null) => {
      const currentCustom = isCustom ? value : { x: 1, y: 1 };
      onChange({ ...currentCustom, [field]: newValue });
    };

    return (
      <div className="space-y-3">
        {/* Combobox with predefined options + custom */}
        <Combobox
          value={
            isCustom ? "custom" : typeof value === "string" ? value : "square"
          }
          onItemSelect={handlePredefinedChange}
          values={[
            ...predefinedOptions.map((option) => ({
              value: option,
              label: t(`pageBuilder.styles.aspectRatio.${option}`),
            })),
            {
              value: "custom",
              label: t("pageBuilder.styles.aspectRatio.custom"),
            },
          ]}
          size="sm"
          className="w-full"
        />

        {/* Custom X/Y inputs */}
        {isCustom && (
          <RawDoubleNumberInput
            prefix1=""
            prefix2=""
            defaultValue1={value.x ?? 1}
            defaultValue2={value.y ?? 1}
            onChange1={(x) => handleCustomChange("x", x)}
            onChange2={(y) => handleCustomChange("y", y)}
            nullable={false}
            size="sm"
            unit=""
            x="/"
            asRow
          />
        )}
      </div>
    );
  },
} as const satisfies StyleDefinition<typeof AspectRatioSchema>;
