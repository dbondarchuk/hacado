import { RawDoubleNumberInput } from "@hacado/builder";
import { BuilderKeys, useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { Move } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const predefinedOptions = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "initial",
  "inherit",
] as const;

const optionsMap: Record<(typeof predefinedOptions)[number], BuilderKeys> = {
  "top-left": "pageBuilder.styles.backgroundPosition.topLeft",
  "top-right": "pageBuilder.styles.backgroundPosition.topRight",
  "bottom-left": "pageBuilder.styles.backgroundPosition.bottomLeft",
  "bottom-right": "pageBuilder.styles.backgroundPosition.bottomRight",
  initial: "pageBuilder.styles.backgroundPosition.initial",
  inherit: "pageBuilder.styles.backgroundPosition.inherit",
  center: "pageBuilder.styles.backgroundPosition.center",
  top: "pageBuilder.styles.backgroundPosition.top",
  bottom: "pageBuilder.styles.backgroundPosition.bottom",
  left: "pageBuilder.styles.backgroundPosition.left",
  right: "pageBuilder.styles.backgroundPosition.right",
};

// Schema for custom X/Y coordinates
const CustomPositionSchema = z.object({
  x: z.number().min(0).max(100).optional().nullable(),
  y: z.number().min(0).max(100).optional().nullable(),
});

// Union schema for both predefined and custom values
const BackgroundPositionSchema = z.union([
  z.enum(predefinedOptions),
  CustomPositionSchema,
]);

type BackgroundPositionValue = z.infer<typeof BackgroundPositionSchema>;

export const backgroundPositionStyle = {
  name: "backgroundPosition",
  label: "builder.pageBuilder.styles.properties.backgroundPosition",
  category: "background",
  icon: ({ className }) => <Move className={className} />,
  schema: BackgroundPositionSchema,
  defaultValue: "center" as BackgroundPositionValue,
  renderToCSS: (value) => {
    if (!value) return null;

    // Handle predefined values
    if (typeof value === "string") {
      return `background-position: ${value};`;
    }

    // Handle custom X/Y values
    if (typeof value === "object" && value !== null) {
      const x = value.x ?? 50;
      const y = value.y ?? 50;
      return `background-position: ${x}% ${y}%;`;
    }

    return null;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");

    // Determine if current value is custom or predefined
    const isCustom = typeof value === "object" && value !== null;

    const handlePredefinedChange = (newValue: string) => {
      if (newValue === "custom") {
        onChange({ x: 50, y: 50 });
      } else {
        onChange(newValue as (typeof predefinedOptions)[number]);
      }
    };

    const handleCustomChange = (field: "x" | "y", newValue: number | null) => {
      const currentCustom = isCustom ? value : { x: 50, y: 50 };
      onChange({ ...currentCustom, [field]: newValue });
    };

    return (
      <div className="space-y-3">
        {/* Combobox with predefined options + custom */}
        <Combobox
          value={
            isCustom ? "custom" : typeof value === "string" ? value : "center"
          }
          onItemSelect={handlePredefinedChange}
          values={[
            ...predefinedOptions.map((option) => ({
              value: option,
              label: t(optionsMap[option]),
            })),
            {
              value: "custom",
              label: t("pageBuilder.styles.backgroundPosition.custom"),
            },
          ]}
          size="sm"
          className="w-full"
        />

        {/* Custom X/Y inputs */}
        {isCustom && (
          <RawDoubleNumberInput
            prefix1="X:"
            prefix2="Y:"
            defaultValue1={value.x ?? 50}
            defaultValue2={value.y ?? 50}
            onChange1={(x) => handleCustomChange("x", x)}
            onChange2={(y) => handleCustomChange("y", y)}
            unit="%"
            nullable={false}
            size="sm"
            x="x"
            asRow
          />
        )}
      </div>
    );
  },
} as const satisfies StyleDefinition<typeof BackgroundPositionSchema>;
