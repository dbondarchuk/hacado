import { Minimize2 } from "lucide-react";
import * as z from "zod";
import { RawNumberInput } from "../../../style-inputs/base/raw-number-input";
import { StyleDefinition } from "../../types";

const FlexShrinkSchema = z.coerce.number<number>().min(0).int();

export const flexShrinkStyle = {
  name: "flexShrink",
  label: "builder.pageBuilder.styles.properties.flexShrink",
  category: "layout",
  schema: FlexShrinkSchema,
  icon: ({ className }) => <Minimize2 className={className} />,
  defaultValue: 1,
  renderToCSS: (value) => {
    if (value === null || typeof value === "undefined") return null;

    return `flex-shrink: ${value};`;
  },
  component: ({ value, onChange }) => (
    <RawNumberInput
      iconLabel={<Minimize2 className="size-4" />}
      value={value}
      setValue={onChange}
      options={[0, 1, 2, 3]}
      nullable={false}
      min={0}
      max={99}
      step={1}
    />
  ),
} as const satisfies StyleDefinition<typeof FlexShrinkSchema>;
