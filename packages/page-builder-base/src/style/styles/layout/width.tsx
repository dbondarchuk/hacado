import { RulerDimensionLine } from "lucide-react";
import {} from "../../../style-inputs/base/raw-number-input-with-units";
import { RawNumberInputWithUnitsAndKeywords } from "../../../style-inputs/base/raw-number-input-with-units-and-keywords";
import { widthOrHeightOptions } from "../../../style-inputs/base/types";
import { StyleDefinition } from "../../types";
import { renderRawNumberWithUnitOrKeywordCss } from "../../utils";
import { getZNumberValueWithUnitOrKeyword } from "../../zod";

const WidthSchema = getZNumberValueWithUnitOrKeyword(
  widthOrHeightOptions.map((option) => option.value),
);

export const widthStyle = {
  name: "width",
  label: "builder.pageBuilder.styles.properties.width",
  category: "layout",
  schema: WidthSchema,
  icon: ({ className }) => <RulerDimensionLine className={className} />,
  defaultValue: { value: 100, unit: "%" },
  renderToCSS: (value) => {
    if (!value) return null;

    return `width: ${renderRawNumberWithUnitOrKeywordCss(value)};`;
  },
  component: ({ value, onChange }) => (
    <RawNumberInputWithUnitsAndKeywords
      icon={<RulerDimensionLine className="size-4" />}
      value={value}
      onChange={onChange}
      keywords={widthOrHeightOptions}
      noMax
    />
  ),
} as const satisfies StyleDefinition<typeof WidthSchema>;
