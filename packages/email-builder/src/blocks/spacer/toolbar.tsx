import {
  ConfigurationProps,
  NumberInputToolbarMenu,
  ToolbarColorMenu,
} from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { PaintBucket } from "lucide-react";
import { SpacerProps, SpacerPropsDefaults } from "./schema";

const heightOptions = [4, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 96, 128];

export const SpacerToolbar = (props: ConfigurationProps<SpacerProps>) => {
  const t = useI18n("builder");

  return (
    <>
      <NumberInputToolbarMenu
        defaultValue={SpacerPropsDefaults.props.height}
        property="props.height"
        tooltip={t("emailBuilder.blocks.spacer.height")}
        options={heightOptions}
        min={4}
        max={128}
        {...props}
      />
      <ToolbarColorMenu
        icon={<PaintBucket />}
        property="style.backgroundColor"
        nullable
        tooltip={t("emailBuilder.blocks.spacer.backgroundColor")}
        {...props}
      />
    </>
  );
};
