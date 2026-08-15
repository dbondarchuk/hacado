import {
  ConfigurationProps,
  NumberInputToolbarMenu,
  ToolbarColorMenu,
} from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { Brush, PaintBucket } from "lucide-react";
import { DividerProps, DividerPropsDefaults } from "./schema";

const lineHeightOptions = [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24];

export const DividerToolbar = (props: ConfigurationProps<DividerProps>) => {
  const t = useI18n("builder");

  return (
    <>
      <ToolbarColorMenu
        icon={<Brush />}
        defaultValue={DividerPropsDefaults.props.lineColor}
        property="props.lineColor"
        tooltip={t("emailBuilder.blocks.divider.lineColor")}
        {...props}
      />
      <NumberInputToolbarMenu
        defaultValue={DividerPropsDefaults.props.lineHeight}
        property="props.lineHeight"
        tooltip={t("emailBuilder.blocks.divider.lineHeight")}
        options={lineHeightOptions}
        min={1}
        max={24}
        {...props}
      />
      <ToolbarColorMenu
        icon={<PaintBucket />}
        property="style.backgroundColor"
        nullable
        tooltip={t("emailBuilder.blocks.divider.backgroundColor")}
        {...props}
      />
    </>
  );
};
