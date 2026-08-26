import { cn } from "@hacado/ui";
import { Square, SquareDashedTopSolid } from "lucide-react";
import { AllOrSidesInput } from "../../../style-inputs/all-or-sides-input";
import { RawNumberInputWithUnit } from "../../../style-inputs/base/raw-number-input-with-units";
import { StyleDefinition } from "../../types";
import { renderAllOrPerSideCss, renderRawNumberWithUnitCss } from "../../utils";
import {
  type NumberValueWithUnit,
  PerSideKey,
  zAllOrPerSide,
  zNumberValueWithUnit,
} from "../../zod";

const BorderWidthItemSchema = zNumberValueWithUnit;
const BorderWidthSchema = zAllOrPerSide(BorderWidthItemSchema);

const defaultBorderWidth: NumberValueWithUnit = { value: 1, unit: "px" };

const turn: Record<PerSideKey, string> = {
  top: "rotate-0",
  right: "rotate-90",
  bottom: "rotate-180",
  left: "-rotate-90",
};

export const borderWidthStyle = {
  name: "borderWidth",
  label: "builder.pageBuilder.styles.properties.borderWidth",
  icon: ({ className }) => <Square className={className} />,
  category: "border",
  schema: BorderWidthSchema,
  defaultValue: defaultBorderWidth,
  renderToCSS: (value) =>
    renderAllOrPerSideCss(value, "border-width", renderRawNumberWithUnitCss),
  component: ({ value, onChange }) => (
    <AllOrSidesInput
      layout="sides"
      value={value}
      onChange={onChange}
      defaultAllValue={defaultBorderWidth}
      renderInput={({
        value: slotValue,
        side,
        onChange: onSlotChange,
        nullable,
      }) =>
        nullable ? (
          <RawNumberInputWithUnit
            icon={
              side === "all" ? (
                <Square className="size-4" />
              ) : (
                <SquareDashedTopSolid className={cn("size-4", turn[side])} />
              )
            }
            nullable
            defaultValue={slotValue}
            onChange={onSlotChange}
          />
        ) : (
          <RawNumberInputWithUnit
            icon={
              side === "all" ? (
                <Square className="size-4" />
              ) : (
                <SquareDashedTopSolid className={cn("size-4", turn[side])} />
              )
            }
            defaultValue={slotValue ?? defaultBorderWidth}
            onChange={onSlotChange}
          />
        )
      }
    />
  ),
} as const satisfies StyleDefinition<typeof BorderWidthSchema>;
