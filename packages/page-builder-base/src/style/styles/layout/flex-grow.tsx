import { ArrowLeftRight } from "lucide-react";
import * as z from "zod";
import { RawNumberInput } from "../../../style-inputs/base/raw-number-input";
import { StyleDefinition } from "../../types";

const FlexGrowSchema = z.coerce.number<number>().min(0).int();

export const flexGrowStyle = {
  name: "flexGrow",
  label: "builder.pageBuilder.styles.properties.flexGrow",
  category: "layout",
  schema: FlexGrowSchema,
  icon: ({ className }) => <ArrowLeftRight className={className} />,
  defaultValue: 0,
  renderToCSS: (value) => {
    if (value === null || typeof value === "undefined") return null;

    return `flex-grow: ${value};`;
  },
  component: ({ value, onChange }) => (
    <RawNumberInput
      iconLabel={<ArrowLeftRight className="size-4" />}
      value={value}
      setValue={onChange}
      options={[0, 1, 2, 3, 4, 5]}
      nullable={false}
      min={0}
      max={99}
      step={1}
    />
  ),
} as const satisfies StyleDefinition<typeof FlexGrowSchema>;
