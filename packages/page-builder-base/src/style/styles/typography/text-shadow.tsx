import { useI18n } from "@timelish/i18n/client";
import { Input, Label } from "@timelish/ui";
import { Type } from "lucide-react";
import * as z from "zod";
import { ColorExtendedInput } from "../../../style-inputs/base/color-exteneded-input";
import { getColorStyle } from "../../helpers/colors";
import { StyleDefinition } from "../../types";
import { zColor } from "../../zod";

const TextShadowSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  blur: z.number().default(0),
  color: zColor,
});

export const textShadowStyle = {
  name: "textShadow",
  label: "builder.pageBuilder.styles.properties.textShadow",
  category: "typography",
  icon: ({ className }) => <Type className={className} />,
  schema: TextShadowSchema,
  defaultValue: {
    x: 0,
    y: 1,
    blur: 2,
    color: "rgba(0, 0, 0, 0.25)",
  },
  renderToCSS: (value) => {
    if (!value) return null;
    const { x, y, blur, color } = value;
    if (x === 0 && y === 0 && blur === 0) return null;
    return `text-shadow: ${x}px ${y}px ${blur}px ${getColorStyle(color)};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");

    const handleChange = (
      field: keyof z.infer<typeof TextShadowSchema>,
      newValue: unknown,
    ) => {
      onChange({ ...value, [field]: newValue });
    };

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">
              {t("pageBuilder.styles.textShadow.xOffset")}
            </Label>
            <Input
              type="number"
              value={value.x}
              onChange={(e) => handleChange("x", parseInt(e.target.value) || 0)}
              className="h-8 text-xs"
              min={-50}
              max={50}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">
              {t("pageBuilder.styles.textShadow.yOffset")}
            </Label>
            <Input
              type="number"
              value={value.y}
              onChange={(e) => handleChange("y", parseInt(e.target.value) || 0)}
              className="h-8 text-xs"
              min={-50}
              max={50}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">
            {t("pageBuilder.styles.textShadow.blur")}
          </Label>
          <Input
            type="number"
            value={value.blur}
            onChange={(e) =>
              handleChange("blur", parseInt(e.target.value) || 0)
            }
            className="h-8 text-xs"
            min={0}
            max={100}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">
            {t("pageBuilder.styles.textShadow.color")}
          </Label>
          <ColorExtendedInput
            defaultValue={value.color}
            onChange={(color) => handleChange("color", color)}
            nullable={false}
          />
        </div>
      </div>
    );
  },
} as const satisfies StyleDefinition<typeof TextShadowSchema>;
