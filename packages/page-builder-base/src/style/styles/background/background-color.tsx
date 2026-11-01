import { PaintBucket } from "lucide-react";
import { ColorExtendedInput } from "../../../style-inputs/base/color-exteneded-input";
import { COLORS, getColorStyle } from "../../helpers/colors";
import { StyleDefinition } from "../../types";
import { zColor } from "../../zod";
import { BackgroundColorOpacityVar } from "./background-color-opacity";

const BackgroundColorSchema = zColor;

export const backgroundColorStyle = {
  name: "backgroundColor",
  label: "builder.pageBuilder.styles.properties.backgroundColor",
  icon: ({ className }) => <PaintBucket className={className} />,
  category: "background",
  schema: BackgroundColorSchema,
  defaultValue: COLORS.primary.value,
  renderToCSS: (value) => {
    if (!value) return "";

    return `background-color: ${getColorStyle(value, `--${BackgroundColorOpacityVar}`)};`;
  },
  component: ({ value, onChange }) => (
    <ColorExtendedInput
      defaultValue={value || COLORS.primary.value}
      onChange={(newValue) => onChange(newValue)}
      nullable={false}
    />
  ),
} as const satisfies StyleDefinition<typeof BackgroundColorSchema>;
