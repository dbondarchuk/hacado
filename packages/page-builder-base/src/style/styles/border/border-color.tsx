import { Brush } from "lucide-react";
import { AllOrSidesInput } from "../../../style-inputs/all-or-sides-input";
import { ColorExtendedInput } from "../../../style-inputs/base/color-exteneded-input";
import { COLORS, getColorStyle } from "../../helpers/colors";
import { StyleDefinition } from "../../types";
import { renderAllOrPerSideCss } from "../../utils";
import { zAllOrPerSide, zColor } from "../../zod";

const BorderColorItemSchema = zColor;
const BorderColorSchema = zAllOrPerSide(BorderColorItemSchema);

const defaultBorderColor = COLORS.primary.value;

export const borderColorStyle = {
  name: "borderColor",
  label: "builder.pageBuilder.styles.properties.borderColor",
  icon: ({ className }) => <Brush className={className} />,
  category: "border",
  schema: BorderColorSchema,
  defaultValue: defaultBorderColor,
  renderToCSS: (value) =>
    renderAllOrPerSideCss(value, "border-color", getColorStyle),
  component: ({ value, onChange }) => (
    <AllOrSidesInput
      layout="sides"
      value={value}
      onChange={onChange}
      defaultAllValue={defaultBorderColor}
      renderInput={({ value: slotValue, onChange: onSlotChange, nullable }) =>
        nullable ? (
          <ColorExtendedInput
            defaultValue={slotValue ?? null}
            onChange={(color) => onSlotChange(color ?? null)}
            nullable
          />
        ) : (
          <ColorExtendedInput
            defaultValue={slotValue || defaultBorderColor}
            onChange={onSlotChange}
            nullable={false}
          />
        )
      }
    />
  ),
} as const satisfies StyleDefinition<typeof BorderColorSchema>;
