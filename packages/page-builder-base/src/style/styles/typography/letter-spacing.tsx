import { TextCursor } from "lucide-react";
import { RawNumberInputWithUnit } from "../../../style-inputs/base/raw-number-input-with-units";
import { StyleDefinition } from "../../types";
import { renderRawNumberWithUnitCss } from "../../utils";
import { zNumberValueWithUnit } from "../../zod";

const LetterSpacingSchema = zNumberValueWithUnit;

export const letterSpacingStyle = {
  name: "letterSpacing",
  label: "builder.pageBuilder.styles.properties.letterSpacing",
  category: "typography",
  icon: ({ className }) => <TextCursor className={className} />,
  schema: LetterSpacingSchema,
  defaultValue: { value: 0, unit: "rem" },
  renderToCSS: (value) => {
    if (!value) return null;

    return `letter-spacing: ${renderRawNumberWithUnitCss(value)};`;
  },
  component: ({ value, onChange }) => (
    <RawNumberInputWithUnit
      icon={<TextCursor className="size-4" />}
      defaultValue={value}
      onChange={onChange}
      noMax
    />
  ),
} as const satisfies StyleDefinition<typeof LetterSpacingSchema>;
