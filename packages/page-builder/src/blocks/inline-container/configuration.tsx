"use client";

import { ConfigurationProps } from "@hacado/builder";
import { StylesConfigurationPanel } from "@hacado/page-builder-base";
import { deepMemo } from "@hacado/ui";
import { useCallback } from "react";
import { InlineContainerProps, styles } from "./schema";
import { inlineContainerShortcuts } from "./shortcuts";

export const InlineContainerConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<InlineContainerProps>) => {
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as InlineContainerProps["style"] }),
      [setData, data],
    );

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={inlineContainerShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      />
    );
  },
);
