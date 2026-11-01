import { ALargeSmall } from "lucide-react";
import { FontSizeInput } from "../../../style-inputs/font-size-input";
import { StyleDefinition } from "../../types";
import { renderRawNumberWithUnitCss } from "../../utils";
import { zNumberValueWithUnit } from "../../zod";

const FontSizeSchema = zNumberValueWithUnit;

export const fontSizeStyle = {
  name: "fontSize",
  label: "builder.pageBuilder.styles.properties.fontSize",
  category: "typography",
  schema: FontSizeSchema,
  icon: ({ className }) => <ALargeSmall className={className} />,
  defaultValue: { value: 16, unit: "px" },
  renderToCSS: (value) => {
    if (!value) return null;

    return `font-size: ${renderRawNumberWithUnitCss(value)};`;
  },
  component: ({ value, onChange }) => (
    <FontSizeInput defaultValue={value} onChange={onChange} />
  ),
} as const satisfies StyleDefinition<typeof FontSizeSchema>;
