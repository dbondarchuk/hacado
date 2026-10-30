"use client";

import { ConfigurationProps } from "@hacado/builder/types";
import { StylesConfigurationPanel } from "@hacado/page-builder-base/configuration-panel";
import { deepMemo } from "@hacado/ui/utils";
import { useCallback } from "react";
import { MarketingFeaturesShowcaseProps } from "./schema";
import { marketingFeaturesShowcaseShortcuts } from "./shortcuts";
import { styles } from "./styles";

export const MarketingFeaturesShowcaseConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<MarketingFeaturesShowcaseProps>) => {
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({
          ...data,
          style: s as MarketingFeaturesShowcaseProps["style"],
        }),
      [setData, data],
    );

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={marketingFeaturesShowcaseShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      />
    );
  },
);
