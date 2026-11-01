import { RulerDimensionLine } from "lucide-react";
import { RawNumberInputWithUnitsAndKeywords } from "../../../style-inputs/base/raw-number-input-with-units-and-keywords";
import { widthOrHeightOptions } from "../../../style-inputs/base/types";
import { StyleDefinition } from "../../types";
import { renderRawNumberWithUnitOrKeywordCss } from "../../utils";
import { getZNumberValueWithUnitOrKeyword } from "../../zod";

const MaxWidthSchema = getZNumberValueWithUnitOrKeyword(
  widthOrHeightOptions.map((option) => option.value),
);

export const maxWidthStyle = {
  name: "maxWidth",
  label: "builder.pageBuilder.styles.properties.maxWidth",
  category: "layout",
  schema: MaxWidthSchema,
  icon: ({ className }) => <RulerDimensionLine className={className} />,
  defaultValue: { value: 100, unit: "%" },
  renderToCSS: (value) => {
    if (!value) return null;

    return `max-width: ${renderRawNumberWithUnitOrKeywordCss(value)};`;
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
} as const satisfies StyleDefinition<typeof MaxWidthSchema>;
