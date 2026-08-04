import {
  ToolbarDropdownMenu,
  ToolbarDropdownPropsValues,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { Leaves } from "@timelish/types";
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { TextAlign } from "../style-inputs/helpers/zod";

type PropsType = { style?: { textAlign?: TextAlign | null } | null };

export const TextAlignDropdownMenu = <T extends PropsType>(
  props: ToolbarDropdownPropsValues<T>,
) => {
  const t = useI18n("builder");

  const items = [
    {
      icon: <AlignLeft />,
      value: "left",
      label: t("emailBuilder.common.toolbars.textAlign.left"),
    },
    {
      icon: <AlignCenter />,
      value: "center",
      label: t("emailBuilder.common.toolbars.textAlign.center"),
    },
    {
      icon: <AlignRight />,
      value: "right",
      label: t("emailBuilder.common.toolbars.textAlign.right"),
    },
  ];

  return (
    <ToolbarDropdownMenu
      items={items}
      tooltip={t("emailBuilder.common.toolbars.textAlign.label")}
      property={"style.textAlign" as Leaves<T>}
      {...props}
    />
  );
};
