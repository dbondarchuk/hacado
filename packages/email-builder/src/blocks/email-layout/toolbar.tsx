import {
  ConfigurationProps,
  ToolbarColorMenu,
  ToolbarDropdownMenu,
  ToolbarDropdownPropsValues,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { Baseline, Brush, PaintBucket, PaintRoller } from "lucide-react";
import { FONT_FAMILIES } from "../../style-inputs/helpers/font-family";
import { fontFamilyItems } from "../../toolbars/font-family";
import { EmailLayoutDefaultProps, EmailLayoutProps } from "./schema";

const LayoutFontFamilyDropdownMenu = (
  props: ToolbarDropdownPropsValues<EmailLayoutProps>,
) => {
  const t = useI18n("builder");
  const selectedFont = FONT_FAMILIES.find(
    (font) => font.key === props.data?.fontFamily,
  );

  return (
    <ToolbarDropdownMenu
      icon={
        <span className="text-xs" style={{ fontFamily: selectedFont?.value }}>
          {selectedFont?.label ?? t("emailBuilder.blocks.emailLayout.inherit")}
        </span>
      }
      items={fontFamilyItems}
      property="fontFamily"
      tooltip={t("emailBuilder.blocks.emailLayout.fontFamily")}
      {...props}
    />
  );
};

export const EmailLayoutToolbar = (
  props: ConfigurationProps<EmailLayoutProps>,
) => {
  const t = useI18n("builder");

  return (
    <>
      <LayoutFontFamilyDropdownMenu
        defaultValue={EmailLayoutDefaultProps.fontFamily}
        {...props}
      />
      <ToolbarColorMenu
        icon={<Baseline />}
        property="textColor"
        tooltip={t("emailBuilder.blocks.emailLayout.textColor")}
        defaultValue={EmailLayoutDefaultProps.textColor}
        {...props}
      />
      <ToolbarColorMenu
        icon={<PaintBucket />}
        property="canvasColor"
        tooltip={t("emailBuilder.blocks.emailLayout.canvasColor")}
        defaultValue={EmailLayoutDefaultProps.canvasColor}
        {...props}
      />
      <ToolbarColorMenu
        icon={<PaintRoller />}
        property="backdropColor"
        tooltip={t("emailBuilder.blocks.emailLayout.backdropColor")}
        defaultValue={EmailLayoutDefaultProps.backdropColor}
        {...props}
      />
      <ToolbarColorMenu
        nullable
        icon={<Brush />}
        property="borderColor"
        tooltip={t("emailBuilder.blocks.emailLayout.borderColor")}
        {...props}
      />
    </>
  );
};
