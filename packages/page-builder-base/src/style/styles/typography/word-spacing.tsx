import { TextCursor } from "lucide-react";
import { RawNumberInputWithUnit } from "../../../style-inputs/base/raw-number-input-with-units";
import { StyleDefinition } from "../../types";
import { renderRawNumberWithUnitCss } from "../../utils";
import { zNumberValueWithUnit } from "../../zod";

const WordSpacingSchema = zNumberValueWithUnit;

export const wordSpacingStyle = {
  name: "wordSpacing",
  label: "builder.pageBuilder.styles.properties.wordSpacing",
  category: "typography",
  icon: ({ className }) => <TextCursor className={className} />,
  schema: WordSpacingSchema,
  defaultValue: { value: 0.3, unit: "rem" },
  renderToCSS: (value) => {
    if (!value) return null;

    return `word-spacing: ${renderRawNumberWithUnitCss(value)};`;
  },
  component: ({ value, onChange }) => (
    <RawNumberInputWithUnit
      icon={<TextCursor className="size-4" />}
      defaultValue={value}
      onChange={onChange}
    />
  ),
} as const satisfies StyleDefinition<typeof WordSpacingSchema>;
