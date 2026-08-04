import {
  ConfigurationProps,
  ToolbarColorMenu,
  ToolbarDropdownMenu,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import {
  Baseline,
  MoveDiagonal2,
  MoveHorizontal,
  PaintbrushVertical,
  PaintBucket,
  Pill,
  RectangleHorizontal,
  SquareRoundCorner,
} from "lucide-react";
import { FontFamilyDropdownMenu } from "../../toolbars/font-family";
import { FontSizeToolbarMenu } from "../../toolbars/font-size";
import { FontWeightDropdownMenu } from "../../toolbars/font-weight";
import { TextAlignDropdownMenu } from "../../toolbars/text-align";
import { ButtonProps, ButtonPropsDefaults } from "./schema";

export const ButtonToolbar = (props: ConfigurationProps<ButtonProps>) => {
  const t = useI18n("builder");

  const styleItems = [
    {
      icon: <SquareRoundCorner />,
      value: "rounded",
      label: t("emailBuilder.blocks.button.styles.rounded"),
    },
    {
      icon: <RectangleHorizontal />,
      value: "rectangle",
      label: t("emailBuilder.blocks.button.styles.rectangle"),
    },
    {
      icon: <Pill />,
      value: "pill",
      label: t("emailBuilder.blocks.button.styles.pill"),
    },
  ];

  const sizeItems = [
    {
      value: "x-small",
      label: t("emailBuilder.blocks.button.sizes.x-small"),
    },
    {
      value: "small",
      label: t("emailBuilder.blocks.button.sizes.small"),
    },
    {
      value: "medium",
      label: t("emailBuilder.blocks.button.sizes.medium"),
    },
    {
      value: "large",
      label: t("emailBuilder.blocks.button.sizes.large"),
    },
  ];

  const widthItems = [
    {
      value: "auto",
      label: t("emailBuilder.blocks.button.widths.auto"),
    },
    {
      value: "full",
      label: t("emailBuilder.blocks.button.widths.full"),
    },
  ];

  return (
    <>
      <TextAlignDropdownMenu
        {...props}
        defaultValue={ButtonPropsDefaults.style.textAlign}
      />
      <FontWeightDropdownMenu
        {...props}
        defaultValue={ButtonPropsDefaults.style.fontWeight}
      />
      <FontFamilyDropdownMenu {...props} />
      <FontSizeToolbarMenu
        {...props}
        defaultValue={ButtonPropsDefaults.style.fontSize}
      />
      <ToolbarDropdownMenu
        items={styleItems}
        defaultValue={ButtonPropsDefaults.props.buttonStyle}
        property="props.buttonStyle"
        tooltip={t("emailBuilder.blocks.button.style")}
        {...props}
      />
      <ToolbarDropdownMenu
        icon={<MoveDiagonal2 />}
        items={sizeItems}
        defaultValue={ButtonPropsDefaults.props.size}
        property="props.size"
        tooltip={t("emailBuilder.blocks.button.size")}
        {...props}
      />
      <ToolbarDropdownMenu
        icon={<MoveHorizontal />}
        items={widthItems}
        defaultValue={ButtonPropsDefaults.props.width}
        property="props.width"
        tooltip={t("emailBuilder.blocks.button.width")}
        {...props}
      />
      <ToolbarColorMenu
        icon={<Baseline />}
        defaultValue={ButtonPropsDefaults.props.buttonTextColor}
        property="props.buttonTextColor"
        tooltip={t("emailBuilder.blocks.button.textColor")}
        {...props}
      />
      <ToolbarColorMenu
        icon={<PaintbrushVertical />}
        defaultValue={ButtonPropsDefaults.props.buttonBackgroundColor}
        property="props.buttonBackgroundColor"
        tooltip={t("emailBuilder.blocks.button.buttonColor")}
        {...props}
      />
      <ToolbarColorMenu
        icon={<PaintBucket />}
        property="style.backgroundColor"
        nullable
        tooltip={t("emailBuilder.blocks.button.backgroundColor")}
        {...props}
      />
    </>
  );
};
