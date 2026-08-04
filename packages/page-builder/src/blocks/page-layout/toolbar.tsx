import {
  ConfigurationProps,
  ToolbarDropdownMenu,
  ToolbarDropdownPropsValues,
  ToolbarToggle,
} from "@timelish/builder";
import { AllKeys, useI18n } from "@timelish/i18n/client";
import {
  backgroundColorShortcut,
  colorShortcut,
  ColorShortcutToolbar,
  FONT_FAMILIES,
  FONT_FAMILIES_LIST,
} from "@timelish/page-builder-base";
import { AlignHorizontalSpaceAround } from "lucide-react";
import { PageLayoutDefaultProps, PageLayoutProps } from "./schema";

const LayoutFontFamilyDropdownMenu = (
  props: ToolbarDropdownPropsValues<PageLayoutProps>,
) => {
  const selectedFont = props.data?.fontFamily
    ? FONT_FAMILIES[props.data?.fontFamily]
    : null;

  const t = useI18n();

  return (
    <ToolbarDropdownMenu
      icon={
        <span className="text-xs" style={{ fontFamily: selectedFont?.value }}>
          {selectedFont?.label
            ? t.has(selectedFont?.label as AllKeys)
              ? t(selectedFont?.label as AllKeys)
              : selectedFont?.label
            : t("builder.pageBuilder.styles.fontFamily.inherit")}
        </span>
      }
      items={FONT_FAMILIES_LIST.map((item) => ({
        ...item,
        value: item.key,
        style: { fontFamily: item.value },
        label: t.has(item.label as AllKeys)
          ? t(item.label as AllKeys)
          : item.label,
      }))}
      property="fontFamily"
      tooltip={t("builder.pageBuilder.styles.properties.fontFamily")}
      {...props}
    />
  );
};

export const PageLayoutToolbar = (
  props: ConfigurationProps<PageLayoutProps>,
) => {
  const t = useI18n("builder");
  return (
    <>
      <ToolbarToggle
        tooltip={t("pageBuilder.blocks.pageLayout.fullWidth")}
        property="fullWidth"
        {...props}
        icon={<AlignHorizontalSpaceAround />}
      />
      <LayoutFontFamilyDropdownMenu
        defaultValue={PageLayoutDefaultProps.fontFamily}
        {...props}
      />
      <ColorShortcutToolbar
        shortcut={{
          shortcut: colorShortcut,
          currentColorValue: props.data.textColor ?? null,
          onValueChange: (value) =>
            props.setData({ ...props.data, textColor: value }),
          tooltip: "builder.pageBuilder.styles.properties.color",
        }}
      />
      <ColorShortcutToolbar
        shortcut={{
          shortcut: backgroundColorShortcut,
          currentColorValue: props.data.backgroundColor ?? null,
          onValueChange: (value) =>
            props.setData({ ...props.data, backgroundColor: value }),
          tooltip: "builder.pageBuilder.styles.properties.backgroundColor",
        }}
      />
    </>
  );
};
