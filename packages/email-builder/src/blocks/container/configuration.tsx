"use client";

import { ConfigurationProps } from "@hacado/builder";
import { MultiStylePropertyPanel } from "../../style-inputs/multi-style-property-panel";
import { ContainerProps } from "./schema";

export const ContainerConfiguration = ({
  data,
  setData,
}: ConfigurationProps<ContainerProps>) => {
  const updateData = (d: unknown) => setData(d as ContainerProps);

  return (
    <>
      <MultiStylePropertyPanel
        names={["backgroundColor", "borderColor", "borderRadius", "padding"]}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </>
  );
};
