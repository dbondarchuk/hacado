import { RulerDimensionLine } from "lucide-react";
import { RawNumberInputWithUnitsAndKeywords } from "../../../style-inputs/base/raw-number-input-with-units-and-keywords";
import { widthOrHeightOptions } from "../../../style-inputs/base/types";
import { StyleDefinition } from "../../types";
import { renderRawNumberWithUnitOrKeywordCss } from "../../utils";
import { getZNumberValueWithUnitOrKeyword } from "../../zod";

const MinWidthSchema = getZNumberValueWithUnitOrKeyword(
  widthOrHeightOptions.map((option) => option.value),
);

export const minWidthStyle = {
  name: "minWidth",
  label: "builder.pageBuilder.styles.properties.minWidth",
  category: "layout",
  schema: MinWidthSchema,
  icon: ({ className }) => <RulerDimensionLine className={className} />,
  defaultValue: { value: 0, unit: "px" },
  renderToCSS: (value) => {
    if (!value) return null;

    return `min-width: ${renderRawNumberWithUnitOrKeywordCss(value)};`;
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
} as const satisfies StyleDefinition<typeof MinWidthSchema>;
