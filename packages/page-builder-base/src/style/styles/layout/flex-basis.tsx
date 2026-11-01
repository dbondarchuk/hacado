import { Percent } from "lucide-react";
import * as z from "zod";
import { RawNumberInputWithUnit } from "../../../style-inputs/base/raw-number-input-with-units";
import { StyleDefinition } from "../../types";

const FlexBasisSchema = z.coerce.number<number>().min(0).max(100).int();

export const flexBasisStyle = {
  name: "flexBasis",
  label: "builder.pageBuilder.styles.properties.flexBasis",
  category: "effects",
  schema: FlexBasisSchema,
  icon: ({ className }) => <Percent className={className} />,
  defaultValue: 100,
  renderToCSS: (value) => {
    if (value === null || typeof value === "undefined") return null;

    return `flex-basis: ${value}%;`;
  },
  component: ({ value, onChange }) => (
    <RawNumberInputWithUnit
      icon={<Percent className="size-4" />}
      defaultValue={{ value: value, unit: "%" }}
      onChange={(newValue) => onChange(newValue.value)}
      min={{ "%": 0 }}
      max={{ "%": 100 }}
      step={{ "%": 1 }}
      options={{ "%": [0, 25, 50, 75, 100] }}
      forceUnit="%"
    />
  ),
} as const satisfies StyleDefinition<typeof FlexBasisSchema>;
