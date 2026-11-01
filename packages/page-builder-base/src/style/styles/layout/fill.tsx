import { Paintbrush } from "lucide-react";
import { ColorExtendedInput } from "../../../style-inputs/base/color-exteneded-input";
import { getColorStyle } from "../../helpers/colors";
import { StyleDefinition } from "../../types";
import { zColor } from "../../zod";

const FillSchema = zColor;

export const fillStyle = {
  name: "fill",
  label: "builder.pageBuilder.styles.properties.fill",
  category: "layout" as const,
  icon: ({ className }: { className?: string }) => (
    <Paintbrush className={className} />
  ),
  schema: FillSchema,
  defaultValue: "currentColor",
  renderToCSS: (value: string | null | undefined) => {
    if (!value) return null;

    return `fill: ${getColorStyle(value)};`;
  },
  component: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <ColorExtendedInput
      defaultValue={value || "currentColor"}
      onChange={onChange}
      nullable={false}
    />
  ),
} as const satisfies StyleDefinition<typeof FillSchema>;
