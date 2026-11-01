import { RulerDimensionLine } from "lucide-react";
import { RawNumberInputWithUnit } from "../../../style-inputs/base/raw-number-input-with-units";
import { StyleDefinition } from "../../types";
import { renderRawNumberWithUnitCss } from "../../utils";
import { zNumberValueWithUnit } from "../../zod";

const GapSchema = zNumberValueWithUnit;

export const gapStyle = {
  name: "gap",
  label: "builder.pageBuilder.styles.properties.gap",
  category: "spacing",
  schema: GapSchema,
  icon: ({ className }) => <RulerDimensionLine className={className} />,
  defaultValue: { value: 0.5, unit: "rem" },
  renderToCSS: (value) => {
    if (!value) return null;

    return `gap: ${renderRawNumberWithUnitCss(value)};`;
  },
  component: ({ value, onChange }) => (
    <RawNumberInputWithUnit
      icon={<RulerDimensionLine className="size-4" />}
      defaultValue={value}
      onChange={onChange}
    />
  ),
} as const satisfies StyleDefinition<typeof GapSchema>;
