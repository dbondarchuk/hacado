import { BuilderKeys, useI18n } from "@hacado/i18n/client";
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
} from "@hacado/ui";
import { AssetSelectorInput } from "@hacado/ui-admin";
import { Image, Plus, Trash2 } from "lucide-react";
import * as z from "zod";
import { ColorExtendedInput } from "../../../style-inputs/base/color-exteneded-input";
import { COLORS, getColorStyle } from "../../helpers/colors";
import { StyleDefinition } from "../../types";
import { zColor } from "../../zod";

const gradientDirectionOptions = [
  "to-right",
  "to-left",
  "to-top",
  "to-bottom",
  "to-top-right",
  "to-top-left",
  "to-bottom-right",
  "to-bottom-left",
  "custom",
] as const;

const gradientDirectionOptionsLabels: Record<GradientDirection, BuilderKeys> = {
  "to-right": "pageBuilder.styles.backgroundImage.toRight",
  "to-left": "pageBuilder.styles.backgroundImage.toLeft",
  "to-top": "pageBuilder.styles.backgroundImage.toTop",
  "to-bottom": "pageBuilder.styles.backgroundImage.toBottom",
  "to-top-right": "pageBuilder.styles.backgroundImage.toTopRight",
  "to-top-left": "pageBuilder.styles.backgroundImage.toTopLeft",
  "to-bottom-right": "pageBuilder.styles.backgroundImage.toBottomRight",
  "to-bottom-left": "pageBuilder.styles.backgroundImage.toBottomLeft",
  custom: "pageBuilder.styles.backgroundImage.customDirection",
};

type GradientDirection = (typeof gradientDirectionOptions)[number];

const BackgroundImageSchema = z.object({
  type: z.enum(["url", "gradient", "none"]),
  value: z.string().optional(),
  gradientType: z.enum(["linear", "radial"]).optional(),
  gradientDirection: z.enum(gradientDirectionOptions).optional(),
  gradientAngle: z.coerce.number<number>().min(0).max(360).optional(),
  gradientColors: z.array(zColor).optional(),
});

const getLinearGradientDirection = (
  value: z.infer<typeof BackgroundImageSchema>,
) => {
  if (value.gradientDirection === "custom") {
    return `${value.gradientAngle ?? 0}deg`;
  }

  return (value.gradientDirection || "to-right").replaceAll("-", " ");
};

export const backgroundImageStyle = {
  name: "backgroundImage",
  label: "builder.pageBuilder.styles.properties.backgroundImage",
  category: "background",
  icon: ({ className }) => <Image className={className} />,
  schema: BackgroundImageSchema,
  defaultValue: {
    type: "none",
  },
  renderToCSS: (value) => {
    if (!value || value.type === "none") return null;

    if (value.type === "url" && value.value) {
      return `background-image: url(${value.value});`;
    }

    if (
      value.type === "gradient" &&
      value.gradientColors &&
      value.gradientColors.length > 0
    ) {
      const colors = value.gradientColors
        .map((color) => getColorStyle(color))
        .join(", ");
      if (value.gradientType === "radial") {
        return `background-image: radial-gradient(circle, ${colors});`;
      } else {
        const direction = getLinearGradientDirection(value);

        return `background-image: linear-gradient(${direction}, ${colors});`;
      }
    }

    return null;
  },
  component: ({ value, onChange }) => {
    const t = useI18n("builder");

    const handleChange = (
      field: keyof z.infer<typeof BackgroundImageSchema>,
      newValue: any,
    ) => {
      if (field === "type" && newValue === "gradient") {
        onChange({
          ...value,
          type: newValue,
          gradientType: "linear",
          gradientDirection: "to-right",
          gradientColors: [COLORS.primary.value, COLORS.secondary.value],
        });
      } else {
        onChange({ ...value, [field]: newValue });
      }
    };

    const handleGradientColorChange = (index: number, color: string | null) => {
      const colors = [...(value.gradientColors || [])];
      if (color === null) {
        colors.splice(index, 1);
      } else {
        colors[index] = color;
      }
      handleChange("gradientColors", colors);
    };

    const addGradientColor = () => {
      const colors = [...(value.gradientColors || []), "#000000"];
      handleChange("gradientColors", colors);
    };

    const removeGradientColor = (index: number) => {
      const colors = [...(value.gradientColors || [])];
      colors.splice(index, 1);
      handleChange("gradientColors", colors);
    };

    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">
            {t("pageBuilder.styles.backgroundImage.type")}
          </Label>
          <Select
            value={value.type}
            onValueChange={(val) => handleChange("type", val)}
          >
            <SelectTrigger size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                {t("pageBuilder.styles.backgroundImage.none")}
              </SelectItem>
              <SelectItem value="url">
                {t("pageBuilder.styles.backgroundImage.url")}
              </SelectItem>
              <SelectItem value="gradient">
                {t("pageBuilder.styles.backgroundImage.gradient")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {value.type === "url" && (
          <div className="space-y-1">
            <Label className="text-xs">
              {t("pageBuilder.styles.backgroundImage.imageUrl")}
            </Label>
            <AssetSelectorInput
              value={value.value || ""}
              accept="image/*"
              onChange={(val) => handleChange("value", val)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        )}

        {value.type === "gradient" && (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">
                {t("pageBuilder.styles.backgroundImage.gradientType")}
              </Label>
              <Select
                value={value.gradientType || "linear"}
                onValueChange={(val) => handleChange("gradientType", val)}
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">
                    {t("pageBuilder.styles.backgroundImage.linear")}
                  </SelectItem>
                  <SelectItem value="radial">
                    {t("pageBuilder.styles.backgroundImage.radial")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {value.gradientType === "linear" && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">
                    {t("pageBuilder.styles.backgroundImage.direction")}
                  </Label>
                  <Select
                    value={
                      value.gradientDirection === "custom"
                        ? "custom"
                        : value.gradientDirection || "to-right"
                    }
                    onValueChange={(val: GradientDirection) => {
                      if (val === "custom") {
                        onChange({
                          ...value,
                          gradientDirection: "custom",
                          gradientAngle: value.gradientAngle ?? 90,
                        });
                      } else {
                        onChange({
                          ...value,
                          gradientDirection: val,
                          gradientAngle: undefined,
                        });
                      }
                    }}
                  >
                    <SelectTrigger size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {gradientDirectionOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(gradientDirectionOptionsLabels[option])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {value.gradientDirection === "custom" && (
                  <div className="space-y-1">
                    <Label className="text-xs">
                      {t("pageBuilder.styles.backgroundImage.customAngle")}
                    </Label>
                    <div className="flex items-center gap-3">
                      <Slider
                        min={0}
                        max={360}
                        step={1}
                        value={[value.gradientAngle ?? 0]}
                        onValueChange={(val) =>
                          handleChange("gradientAngle", val[0] ?? 0)
                        }
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0 w-10 text-right">
                        {value.gradientAngle ?? 0}°
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">
                  {t("pageBuilder.styles.backgroundImage.colors")}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addGradientColor}
                  className="h-6 px-2 text-xs"
                >
                  <Plus className="size-3 mr-1" />
                  {t("pageBuilder.styles.backgroundImage.addColor")}
                </Button>
              </div>

              <div className="space-y-2">
                {(value.gradientColors || []).map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <ColorExtendedInput
                        defaultValue={color}
                        onChange={(val) =>
                          handleGradientColorChange(index, val)
                        }
                        nullable={false}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => removeGradientColor(index)}
                      className="h-6 px-2 text-xs"
                      disabled={(value.gradientColors || []).length <= 1}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {(!value.gradientColors || value.gradientColors.length === 0) && (
                <div className="text-xs text-muted-foreground">
                  {t("pageBuilder.styles.backgroundImage.addColor")}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
} as const satisfies StyleDefinition<typeof BackgroundImageSchema>;
