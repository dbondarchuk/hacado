import { useI18n } from "@hacado/i18n/client";
import { Combobox } from "@hacado/ui";
import { Crosshair } from "lucide-react";
import * as z from "zod";
import { StyleDefinition } from "../../types";

const transformOriginKeys = [
  "center",
  "top",
  "top left",
  "top right",
  "left",
  "right",
  "bottom",
  "bottom left",
  "bottom right",
] as const;

const transformOriginKeyMap = {
  center: "center",
  top: "top",
  "top left": "top_left",
  "top right": "top_right",
  left: "left",
  right: "right",
  bottom: "bottom",
  "bottom left": "bottom_left",
  "bottom right": "bottom_right",
} as const;

const TransformOriginSchema = z.enum(transformOriginKeys);

export const transformOriginStyle = {
  name: "transformOrigin",
  label: "builder.pageBuilder.styles.properties.transformOrigin",
  category: "effects",
  icon: ({ className }) => <Crosshair className={className} />,
  schema: TransformOriginSchema,
  defaultValue: "center",
  renderToCSS: (value) => {
    if (!value || value === "center") return null;
    return `transform-origin: ${value};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");
    return (
      <Combobox
        values={transformOriginKeys.map((origin) => ({
          value: origin,
          label: t(
            `pageBuilder.styles.transformOrigin.${transformOriginKeyMap[origin]}`,
          ),
        }))}
        value={value}
        onItemSelect={(val) =>
          onChange(val as z.infer<typeof TransformOriginSchema>)
        }
        className="w-full"
        size="sm"
      />
    );
  },
} as const satisfies StyleDefinition<typeof TransformOriginSchema>;
