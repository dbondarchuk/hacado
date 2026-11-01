import { Move } from "lucide-react";
import { FourSideValuesInput } from "../../../style-inputs/four-side-values-input";
import { StyleDefinition } from "../../types";
import { renderFourSideValuesCss } from "../../utils";
import { zFourSideValues } from "../../zod";

const InsetSchema = zFourSideValues;

export const insetStyle = {
  name: "inset",
  label: "builder.pageBuilder.styles.properties.inset",
  category: "layout",
  schema: InsetSchema,
  icon: ({ className }) => <Move className={className} />,
  defaultValue: {
    top: { value: 0, unit: "px" },
    right: { value: 0, unit: "px" },
    bottom: { value: 0, unit: "px" },
    left: { value: 0, unit: "px" },
  },
  renderToCSS: (value) => {
    if (!value) return null;

    return renderFourSideValuesCss(value);
  },
  component: ({ value, onChange }) => (
    <FourSideValuesInput
      defaultValue={value}
      onChange={onChange}
      noMax
      noMin
      allowNegative
    />
  ),
} as const satisfies StyleDefinition<typeof InsetSchema>;
