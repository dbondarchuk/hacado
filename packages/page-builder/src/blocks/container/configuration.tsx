"use client";

import { ConfigurationProps } from "@hacado/builder";
import { StylesConfigurationPanel } from "@hacado/page-builder-base";
import { deepMemo } from "@hacado/ui";
import { useCallback } from "react";
import { ContainerProps, styles } from "./schema";
import { containerShortcuts } from "./shortcuts";

export const ContainerConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<ContainerProps>) => {
    const updateStyle = useCallback(
      (s: unknown) => setData({ ...data, style: s as ContainerProps["style"] }),
      [setData, data],
    );

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={containerShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      />
    );
  },
);
