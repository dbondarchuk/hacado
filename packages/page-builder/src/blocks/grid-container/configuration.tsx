"use client";

import { ConfigurationProps } from "@hacado/builder/types";
import { StylesConfigurationPanel } from "@hacado/page-builder-base/configuration-panel";
import { deepMemo } from "@hacado/ui/utils";
import { useCallback } from "react";
import { GridContainerProps, styles } from "./schema";
import { gridContainerShortcuts } from "./shortcuts";

export const GridContainerConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<GridContainerProps>) => {
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as GridContainerProps["style"] }),
      [setData, data],
    );

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={gridContainerShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      />
    );
  },
);
