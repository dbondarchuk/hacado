"use client";

import { ConfigurationProps } from "@hacado/builder";
import { StylesConfigurationPanel } from "@hacado/page-builder-base";
import { deepMemo } from "@hacado/ui";
import { useCallback } from "react";
import { SpacerProps } from "./schema";
import { spacerShortcuts } from "./shortcuts";
import { styles } from "./styles";

export const SpacerConfiguration = deepMemo(
  ({ data, setData, base, onBaseChange }: ConfigurationProps<SpacerProps>) => {
    const updateStyle = useCallback(
      (s: unknown) => setData({ ...data, style: s as SpacerProps["style"] }),
      [setData, data],
    );

    return (
      <StylesConfigurationPanel
        shortcuts={spacerShortcuts}
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        base={base}
        onBaseChange={onBaseChange}
      />
    );
  },
);
