import { Layers } from "lucide-react";
import * as z from "zod";
import { RawNumberInput } from "../../../style-inputs/base/raw-number-input";
import { StyleDefinition } from "../../types";

const ZIndexSchema = z.coerce.number<number>().int();

export const zIndexStyle = {
  name: "zIndex",
  label: "builder.pageBuilder.styles.properties.zIndex",
  category: "layout",
  icon: ({ className }) => <Layers className={className} />,
  schema: ZIndexSchema,
  defaultValue: 0,
  renderToCSS: (value) => {
    if (value === null || typeof value === "undefined") return null;

    return `z-index: ${value};`;
  },
  component: ({ value, onChange }) => (
    <RawNumberInput
      iconLabel={<Layers className="size-4" />}
      value={value}
      setValue={onChange}
      options={[-1, 0, 1, 10, 100, 1000]}
      nullable={false}
      min={-9999}
      max={9999}
      step={1}
    />
  ),
} as const satisfies StyleDefinition<typeof ZIndexSchema>;
