import { TextCursor } from "lucide-react";
import { RawNumberInputWithUnit } from "../../../style-inputs/base/raw-number-input-with-units";
import { StyleDefinition } from "../../types";
import { renderRawNumberWithUnitCss } from "../../utils";
import { unitsWithUnitless, zNumberValueWithUnitOrUnitless } from "../../zod";

const LineHeightSchema = zNumberValueWithUnitOrUnitless;

export const lineHeightStyle = {
  name: "lineHeight",
  label: "builder.pageBuilder.styles.properties.lineHeight",
  category: "typography",
  schema: LineHeightSchema,
  icon: ({ className }) => <TextCursor className={className} />,
  defaultValue: { value: 1.125, unit: "" },
  renderToCSS: (value) => {
    if (!value) return null;
    return `line-height: ${renderRawNumberWithUnitCss(value)};`;
  },
  component: ({ value, onChange }) => (
    <RawNumberInputWithUnit
      icon={<TextCursor className="size-4" />}
      defaultValue={value}
      onChange={onChange}
      allowedUnits={unitsWithUnitless}
      noMax
    />
  ),
} as const satisfies StyleDefinition<typeof LineHeightSchema>;
