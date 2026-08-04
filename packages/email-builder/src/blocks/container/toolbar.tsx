import { ConfigurationProps, ToolbarColorMenu } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { Brush, PaintBucket } from "lucide-react";
import { ContainerProps } from "./schema";

export const ContainerToolbar = (props: ConfigurationProps<ContainerProps>) => {
  const t = useI18n("builder");

  return (
    <>
      <ToolbarColorMenu
        icon={<PaintBucket />}
        property="style.backgroundColor"
        nullable
        tooltip={t("emailBuilder.blocks.container.backgroundColor")}
        {...props}
      />
      <ToolbarColorMenu
        nullable
        icon={<Brush />}
        property="style.borderColor"
        tooltip={t("emailBuilder.blocks.container.borderColor")}
        {...props}
      />
    </>
  );
};
