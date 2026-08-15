"use client";

import { ConfigurationProps, SliderInput } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { ArrowUpDown } from "lucide-react";
import { MultiStylePropertyPanel } from "../../style-inputs/multi-style-property-panel";
import { SpacerProps, SpacerPropsDefaults } from "./schema";

export const SpacerConfiguration = ({
  data,
  setData,
}: ConfigurationProps<SpacerProps>) => {
  const t = useI18n("builder");
  const updateData = (d: unknown) => setData(d as SpacerProps);

  return (
    <>
      <SliderInput
        label={t("emailBuilder.blocks.spacer.height")}
        iconLabel={<ArrowUpDown />}
        units="px"
        step={4}
        min={4}
        max={128}
        defaultValue={data.props?.height ?? SpacerPropsDefaults.props.height}
        onChange={(height) =>
          updateData({ ...data, props: { ...data.props, height } })
        }
      />
      <MultiStylePropertyPanel
        names={["backgroundColor"]}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </>
  );
};
