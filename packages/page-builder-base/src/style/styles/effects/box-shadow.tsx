import { useI18n } from "@timelish/i18n/client";
import { Input, Label } from "@timelish/ui";
import { Box } from "lucide-react";
import * as z from "zod";
import { ColorExtendedInput } from "../../../style-inputs/base/color-exteneded-input";
import { getColorStyle } from "../../helpers/colors";
import { StyleDefinition } from "../../types";
import { zColor } from "../../zod";

const BoxShadowSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  blur: z.number().default(0),
  spread: z.number().default(0),
  color: zColor,
  inset: z.boolean().default(false),
});

export const boxShadowStyle = {
  name: "boxShadow",
  label: "builder.pageBuilder.styles.properties.boxShadow",
  category: "effects",
  icon: ({ className }) => <Box className={className} />,
  schema: BoxShadowSchema,
  defaultValue: {
    x: 0,
    y: 1,
    blur: 3,
    spread: 0,
    color: "rgba(0, 0, 0, 0.1)",
    inset: false,
  },
  renderToCSS: (value) => {
    if (!value) return null;
    const { x, y, blur, spread, color, inset } = value;
    const insetStr = inset ? "inset " : "";
    return `box-shadow: ${insetStr}${x}px ${y}px ${blur}px ${spread}px ${getColorStyle(color)};`;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");

    const handleChange = (
      field: keyof z.infer<typeof BoxShadowSchema>,
      newValue: any,
    ) => {
      onChange({ ...value, [field]: newValue });
    };

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">
              {t("pageBuilder.styles.boxShadow.xOffset")}
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
              {t("pageBuilder.styles.boxShadow.yOffset")}
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
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">
              {t("pageBuilder.styles.boxShadow.blur")}
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
              {t("pageBuilder.styles.boxShadow.spread")}
            </Label>
            <Input
              type="number"
              value={value.spread}
              onChange={(e) =>
                handleChange("spread", parseInt(e.target.value) || 0)
              }
              className="h-8 text-xs"
              min={0}
              max={50}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">
            {t("pageBuilder.styles.boxShadow.color")}
          </Label>
          <ColorExtendedInput
            defaultValue={value.color}
            onChange={(color) => handleChange("color", color)}
            nullable={false}
          />
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="inset"
            checked={value.inset}
            onChange={(e) => handleChange("inset", e.target.checked)}
            className="h-3 w-3"
          />
          <Label htmlFor="inset" className="text-xs">
            {t("pageBuilder.styles.boxShadow.inset")}
          </Label>
        </div>
      </div>
    );
  },
} as const satisfies StyleDefinition<typeof BoxShadowSchema>;
