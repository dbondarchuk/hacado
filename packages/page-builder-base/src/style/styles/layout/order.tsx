import { ListOrdered } from "lucide-react";
import * as z from "zod";
import { RawNumberInput } from "../../../style-inputs/base/raw-number-input";
import { StyleDefinition } from "../../types";

const OrderSchema = z.coerce.number<number>().int();

export const orderStyle = {
  name: "order",
  label: "builder.pageBuilder.styles.properties.order",
  category: "layout",
  schema: OrderSchema,
  icon: ({ className }) => <ListOrdered className={className} />,
  defaultValue: 0,
  renderToCSS: (value) => {
    if (value === null || typeof value === "undefined" || value === 0)
      return null;

    return `order: ${value};`;
  },
  component: ({ value, onChange }) => (
    <RawNumberInput
      iconLabel={<ListOrdered className="size-4" />}
      value={value}
      setValue={onChange}
      options={[-2, -1, 0, 1, 2, 3, 5, 10]}
      nullable={false}
      min={-99}
      max={99}
      step={1}
    />
  ),
} as const satisfies StyleDefinition<typeof OrderSchema>;
