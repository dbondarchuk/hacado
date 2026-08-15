import { BaseAllKeys } from "@hacado/i18n";
import { Ruler } from "lucide-react";
import { RawNumberInputWithUnitsAndKeywords } from "../../../style-inputs/base/raw-number-input-with-units-and-keywords";
import { widthOrHeightOptions } from "../../../style-inputs/base/types";
import { StyleDefinition } from "../../types";
import { renderRawNumberWithUnitOrKeywordCss } from "../../utils";
import { getZNumberValueWithUnitOrKeyword } from "../../zod";

const HeightSchema = getZNumberValueWithUnitOrKeyword(
  widthOrHeightOptions.map((option) => option.value),
);

export const heightStyle = {
  name: "height",
  label: "builder.pageBuilder.styles.properties.height" satisfies BaseAllKeys,
  category: "layout",
  schema: HeightSchema,
  icon: ({ className }) => <Ruler className={className} />,
  defaultValue: { value: 100, unit: "%" },
  renderToCSS: (value) => {
    if (!value) return null;
    return `height: ${renderRawNumberWithUnitOrKeywordCss(value)};`;
  },
  component: ({ value, onChange }) => (
    <RawNumberInputWithUnitsAndKeywords
      icon={<Ruler className="size-4" />}
      value={value}
      onChange={onChange}
      keywords={widthOrHeightOptions}
      noMax
    />
  ),
} as const satisfies StyleDefinition<typeof HeightSchema>;
