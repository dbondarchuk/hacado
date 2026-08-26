import { cn } from "@hacado/ui";
import { SquareRoundCorner } from "lucide-react";
import { AllOrSidesInput } from "../../../style-inputs/all-or-sides-input";
import { RawNumberInputWithUnit } from "../../../style-inputs/base/raw-number-input-with-units";
import { StyleDefinition } from "../../types";
import {
  renderAllOrPerCornerCss,
  renderRawNumberWithUnitCss,
} from "../../utils";
import {
  type NumberValueWithUnit,
  PerCornerKey,
  zAllOrPerCorner,
  zNumberValueWithUnit,
} from "../../zod";

const BorderRadiusItemSchema = zNumberValueWithUnit;
const BorderRadiusSchema = zAllOrPerCorner(BorderRadiusItemSchema);

const defaultBorderRadius: NumberValueWithUnit = { value: 0, unit: "%" };

const turn: Record<PerCornerKey | "all", string> = {
  all: "",
  topRight: "rotate-0",
  bottomRight: "rotate-90",
  bottomLeft: "rotate-180",
  topLeft: "-rotate-90",
};

export const borderRadiusStyle = {
  name: "borderRadius",
  label: "builder.pageBuilder.styles.properties.borderRadius",
  icon: ({ className }) => <SquareRoundCorner className={className} />,
  category: "border",
  schema: BorderRadiusSchema,
  defaultValue: defaultBorderRadius,
  renderToCSS: (value) =>
    renderAllOrPerCornerCss(value, "border-radius", renderRawNumberWithUnitCss),
  component: ({ value, onChange }) => (
    <AllOrSidesInput
      layout="corners"
      value={value}
      onChange={onChange}
      defaultAllValue={defaultBorderRadius}
      renderInput={({
        value: slotValue,
        side,
        onChange: onSlotChange,
        nullable,
      }) =>
        nullable ? (
          <RawNumberInputWithUnit
            icon={<SquareRoundCorner className={cn("size-4", turn[side])} />}
            nullable
            defaultValue={slotValue}
            onChange={onSlotChange}
          />
        ) : (
          <RawNumberInputWithUnit
            icon={<SquareRoundCorner className={cn("size-4", turn[side])} />}
            defaultValue={slotValue ?? defaultBorderRadius}
            onChange={onSlotChange}
          />
        )
      }
    />
  ),
} as const satisfies StyleDefinition<typeof BorderRadiusSchema>;
