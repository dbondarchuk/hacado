import {
  ConfigurationProps,
  ToolbarColorMenu,
  ToolbarDropdownMenu,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { PaintBucket } from "lucide-react";
import { ContentAlignmentDropdownMenu } from "../../toolbars/content-alignment";
import { ColumnsContainerProps, ColumnsContainerPropsDefaults } from "./schema";

export const ColumnsContainerToolbar = (
  props: ConfigurationProps<ColumnsContainerProps>,
) => {
  const t = useI18n("builder");

  const columnsItems = [
    {
      value: "2",
      label: t("emailBuilder.blocks.columnsContainer.columnCounts.2"),
    },
    {
      value: "3",
      label: t("emailBuilder.blocks.columnsContainer.columnCounts.3"),
    },
  ];

  return (
    <>
      <ToolbarDropdownMenu
        icon={
          props.data?.props?.columnsCount === 2
            ? t("emailBuilder.blocks.columnsContainer.columnCounts.2")
            : t("emailBuilder.blocks.columnsContainer.columnCounts.3")
        }
        items={columnsItems}
        defaultValue={ColumnsContainerPropsDefaults.props.columnsCount.toString()}
        property="props.columnsCount"
        tooltip={t("emailBuilder.blocks.columnsContainer.columns")}
        {...props}
        data={{
          ...props.data,
          props: {
            ...props.data?.props,
            columnsCount: props.data?.props?.columnsCount?.toString() as any,
          },
        }}
        setData={(data) => {
          props.setData({
            ...data,
            props: {
              ...data.props,
              columnsCount:
                data.props?.columnsCount?.toString() === "2" ? 2 : 3,
            },
          });
        }}
      />
      <ContentAlignmentDropdownMenu
        defaultValue={ColumnsContainerPropsDefaults.props.contentAlignment}
        {...props}
      />
      <ToolbarColorMenu
        icon={<PaintBucket />}
        property="style.backgroundColor"
        nullable
        tooltip={t("emailBuilder.blocks.columnsContainer.backgroundColor")}
        {...props}
      />
    </>
  );
};
