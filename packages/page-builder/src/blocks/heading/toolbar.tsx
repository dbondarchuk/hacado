import { ConfigurationProps, ToolbarDropdownMenu } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { ShortcutsToolbar } from "@hacado/page-builder-base";
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
} from "lucide-react";
import { DefaultHeadingLevel, HeadingProps } from "./schema";
import { headingShortcuts } from "./shortcuts";

export const HeadingToolbar = (props: ConfigurationProps<HeadingProps>) => {
  const t = useI18n("builder");

  const levelItems = [
    {
      icon: <Heading1 />,
      value: "h1",
      label: t("pageBuilder.blocks.heading.levels.h1"),
    },
    {
      icon: <Heading2 />,
      value: "h2",
      label: t("pageBuilder.blocks.heading.levels.h2"),
    },
    {
      icon: <Heading3 />,
      value: "h3",
      label: t("pageBuilder.blocks.heading.levels.h3"),
    },
    {
      icon: <Heading4 />,
      value: "h4",
      label: t("pageBuilder.blocks.heading.levels.h4"),
    },
    {
      icon: <Heading5 />,
      value: "h5",
      label: t("pageBuilder.blocks.heading.levels.h5"),
    },
    {
      icon: <Heading6 />,
      value: "h6",
      label: t("pageBuilder.blocks.heading.levels.h6"),
    },
  ];

  return (
    <>
      <ToolbarDropdownMenu
        items={levelItems}
        defaultValue={DefaultHeadingLevel}
        property="props.level"
        tooltip={t("pageBuilder.blocks.heading.level")}
        {...props}
      />

      <ShortcutsToolbar
        shortcuts={headingShortcuts}
        data={props.data}
        setData={props.setData}
      />
    </>
  );
};
