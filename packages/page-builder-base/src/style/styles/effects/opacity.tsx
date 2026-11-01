import { Blend } from "lucide-react";
import * as z from "zod";
import { RawNumberInputWithUnit } from "../../../style-inputs/base/raw-number-input-with-units";
import { StyleDefinition } from "../../types";

const OpacitySchema = z.coerce.number<number>().min(0).max(100).int();

export const opacityStyle = {
  name: "opacity",
  label: "builder.pageBuilder.styles.properties.opacity",
  category: "effects",
  schema: OpacitySchema,
  icon: ({ className }) => <Blend className={className} />,
  defaultValue: 100,
  renderToCSS: (value) => {
    if (value === null || typeof value === "undefined") return null;

    return `opacity: ${(value / 100).toFixed(2)};`;
  },
  component: ({ value, onChange }) => (
    <RawNumberInputWithUnit
      icon={<Blend className="size-4" />}
      defaultValue={{ value: value, unit: "%" }}
      onChange={(newValue) => onChange(newValue.value)}
      min={{ "%": 0 }}
      max={{ "%": 100 }}
      step={{ "%": 1 }}
      options={{ "%": [0, 25, 50, 75, 100] }}
      forceUnit="%"
    />
  ),
} as const satisfies StyleDefinition<typeof OpacitySchema>;
