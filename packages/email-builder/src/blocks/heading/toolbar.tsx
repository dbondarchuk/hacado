import {
  ConfigurationProps,
  ToolbarColorMenu,
  ToolbarDropdownMenu,
} from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import {
  Baseline,
  Heading1,
  Heading2,
  Heading3,
  PaintBucket,
} from "lucide-react";
import { FontFamilyDropdownMenu } from "../../toolbars/font-family";
import { FontSizeToolbarMenu } from "../../toolbars/font-size";
import { FontWeightDropdownMenu } from "../../toolbars/font-weight";
import { TextAlignDropdownMenu } from "../../toolbars/text-align";
import { HeadingProps, HeadingPropsDefaults } from "./schema";
import { getFontSize } from "./styles";

export const HeadingToolbar = (props: ConfigurationProps<HeadingProps>) => {
  const t = useI18n("builder");

  const levelItems = [
    {
      icon: <Heading1 />,
      value: "h1",
      label: t("emailBuilder.blocks.heading.h1"),
    },
    {
      icon: <Heading2 />,
      value: "h2",
      label: t("emailBuilder.blocks.heading.h2"),
    },
    {
      icon: <Heading3 />,
      value: "h3",
      label: t("emailBuilder.blocks.heading.h3"),
    },
  ];

  return (
    <>
      <TextAlignDropdownMenu
        {...props}
        defaultValue={HeadingPropsDefaults.style.textAlign}
      />
      <ToolbarDropdownMenu
        items={levelItems}
        defaultValue={HeadingPropsDefaults.props.level}
        property="props.level"
        tooltip={t("emailBuilder.blocks.heading.level")}
        {...props}
      />
      <FontWeightDropdownMenu
        {...props}
        defaultValue={HeadingPropsDefaults.style.fontWeight}
      />
      <FontFamilyDropdownMenu {...props} />
      <FontSizeToolbarMenu
        {...props}
        defaultValue={getFontSize(
          props.data.props?.level || HeadingPropsDefaults.props.level,
        )}
      />
      <ToolbarColorMenu
        icon={<Baseline />}
        nullable
        property="style.color"
        tooltip={t("emailBuilder.blocks.heading.textColor")}
        {...props}
      />
      <ToolbarColorMenu
        icon={<PaintBucket />}
        property="style.backgroundColor"
        nullable
        tooltip={t("emailBuilder.blocks.heading.backgroundColor")}
        {...props}
      />
    </>
  );
};
