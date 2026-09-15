import { Paintbrush } from "lucide-react";
import { ColorExtendedInput } from "../../../style-inputs/base/color-exteneded-input";
import { COLORS, getColorStyle } from "../../helpers/colors";
import { StyleDefinition } from "../../types";
import { zColor } from "../../zod";

const ColorSchema = zColor;

export const colorStyle = {
  name: "color",
  label: "builder.pageBuilder.styles.properties.color",
  category: "typography",
  icon: ({ className }) => <Paintbrush className={className} />,
  schema: ColorSchema,
  defaultValue: COLORS.foreground.value,
  renderToCSS: (value) => {
    if (!value) return null;
    return `color: ${getColorStyle(value)};`;
  },
  component: ({ value, onChange }) => (
    <ColorExtendedInput
      defaultValue={value || COLORS.foreground.value}
      onChange={onChange}
      nullable={false}
    />
  ),
} as const satisfies StyleDefinition<typeof ColorSchema>;
