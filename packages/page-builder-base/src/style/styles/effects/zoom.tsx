import { ZoomIn } from "lucide-react";
import * as z from "zod";
import { RawNumberInputWithUnit } from "../../../style-inputs/base/raw-number-input-with-units";
import { StyleDefinition } from "../../types";

const ZoomSchema = z.coerce.number<number>().min(0);

export const zoomStyle = {
  name: "zoom",
  label: "builder.pageBuilder.styles.properties.zoom",
  category: "effects",
  schema: ZoomSchema,
  icon: ({ className }) => <ZoomIn className={className} />,
  defaultValue: 100,
  renderToCSS: (value) => {
    if (value === null || typeof value === "undefined" || value === 1)
      return null;

    return `zoom: ${value};`;
  },
  component: ({ value, onChange }) => (
    <RawNumberInputWithUnit
      icon={<ZoomIn className="size-4" />}
      defaultValue={{ value: value, unit: "%" }}
      onChange={(newValue) => onChange(newValue.value)}
      min={{ "%": 0 }}
      step={{ "%": 5 }}
      options={{ "%": [0, 50, 75, 100, 150, 200, 250, 300] }}
      forceUnit="%"
      noMax
    />
  ),
} as const satisfies StyleDefinition<typeof ZoomSchema>;
