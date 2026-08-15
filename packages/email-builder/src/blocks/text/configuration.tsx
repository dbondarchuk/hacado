"use client";

import { ConfigurationProps } from "@hacado/builder";
import { MultiStylePropertyPanel } from "../../style-inputs/multi-style-property-panel";
import { TextProps } from "./schema";

export const TextConfiguration = ({
  data,
  setData,
}: ConfigurationProps<TextProps>) => {
  const updateData = (d: unknown) => setData(d as TextProps);

  return (
    <>
      <MultiStylePropertyPanel
        names={["color", "backgroundColor", "fontFamily", "padding"]}
        value={data.style}
        onChange={(style) => updateData({ ...data, style })}
      />
    </>
  );
};
