"use client";

import { ColumnsContainerProps } from "./schema";

import {
  ConfigurationProps,
  RadioGroupInput,
  RadioGroupInputItem,
  SliderInput,
} from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  BetweenVerticalStart,
  FoldVertical,
} from "lucide-react";
import { MultiStylePropertyPanel } from "../../style-inputs/multi-style-property-panel";
import { ColumnWidthsInput } from "./column-widths-input";

export const ColumnsContainerConfiguration = ({
  data,
  setData,
}: ConfigurationProps<ColumnsContainerProps>) => {
  const t = useI18n("builder");
  const updateData = (d: unknown) => setData(d as ColumnsContainerProps);

  return (
    <>
      <RadioGroupInput
        label={t("emailBuilder.blocks.columnsContainer.numberOfColumns")}
        defaultValue={data.props?.columnsCount === 2 ? "2" : "3"}
        onChange={(v) => {
          updateData({
            ...data,
            props: { ...data.props, columnsCount: v === "2" ? 2 : 3 },
          });
        }}
      >
        <RadioGroupInputItem value="2">2</RadioGroupInputItem>
        <RadioGroupInputItem value="3">3</RadioGroupInputItem>
      </RadioGroupInput>
      <ColumnWidthsInput
        columnsCount={data.props?.columnsCount || 3}
        defaultValue={data.props?.fixedWidths}
        onChange={(fixedWidths) => {
          updateData({ ...data, props: { ...data.props, fixedWidths } });
        }}
      />
      <SliderInput
        label={t("emailBuilder.blocks.columnsContainer.columnsGap")}
        iconLabel={
          <BetweenVerticalStart className="text-secondary-foreground" />
        }
        units="px"
        step={4}
        min={0}
        max={80}
        defaultValue={data.props?.columnsGap ?? 0}
        onChange={(columnsGap) =>
          updateData({ ...data, props: { ...data.props, columnsGap } })
        }
      />
      <RadioGroupInput
        label={t("emailBuilder.blocks.columnsContainer.alignment")}
        defaultValue={data.props?.contentAlignment ?? "middle"}
        onChange={(contentAlignment) => {
          updateData({ ...data, props: { ...data.props, contentAlignment } });
        }}
      >
        <RadioGroupInputItem value="top">
          <ArrowUpToLine fontSize="small" />{" "}
          {t("emailBuilder.blocks.columnsContainer.alignments.top")}
        </RadioGroupInputItem>
        <RadioGroupInputItem value="middle">
          <FoldVertical fontSize="small" />{" "}
          {t("emailBuilder.blocks.columnsContainer.alignments.middle")}
        </RadioGroupInputItem>
        <RadioGroupInputItem value="bottom">
          <ArrowDownToLine fontSize="small" />{" "}
          {t("emailBuilder.blocks.columnsContainer.alignments.bottom")}
        </RadioGroupInputItem>
      </RadioGroupInput>

      <MultiStylePropertyPanel
        names={["backgroundColor", "padding"]}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </>
  );
};
