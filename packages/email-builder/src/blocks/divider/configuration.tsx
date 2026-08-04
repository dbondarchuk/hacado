"use client";

import { ColorInput, ConfigurationProps, SliderInput } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { ArrowUpDown } from "lucide-react";
import { MultiStylePropertyPanel } from "../../style-inputs/multi-style-property-panel";
import { DividerProps, DividerPropsDefaults } from "./schema";

export const DividerConfiguration = ({
  data,
  setData,
}: ConfigurationProps<DividerProps>) => {
  const t = useI18n("builder");
  const updateData = (d: unknown) => setData(d as DividerProps);

  const lineColor =
    data.props?.lineColor ?? DividerPropsDefaults.props.lineColor;
  const lineHeight =
    data.props?.lineHeight ?? DividerPropsDefaults.props.lineHeight;

  return (
    <>
      <ColorInput
        label={t("emailBuilder.blocks.divider.color")}
        defaultValue={lineColor}
        onChange={(lineColor) =>
          updateData({ ...data, props: { ...data.props, lineColor } })
        }
      />
      <SliderInput
        label={t("emailBuilder.blocks.divider.height")}
        iconLabel={<ArrowUpDown />}
        units="px"
        step={1}
        min={1}
        max={24}
        defaultValue={lineHeight}
        onChange={(lineHeight) =>
          updateData({ ...data, props: { ...data.props, lineHeight } })
        }
      />
      <MultiStylePropertyPanel
        names={["backgroundColor", "padding"]}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </>
  );
};
