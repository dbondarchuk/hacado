"use client";

import { ConfigurationProps, TextInput } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { StylesConfigurationPanel } from "@hacado/page-builder-base";
import { deepMemo } from "@hacado/ui";
import { useCallback } from "react";
import { MarketingScrollingLogosProps } from "./schema";
import { marketingScrollingLogosShortcuts } from "./shortcuts";
import { styles } from "./styles";

export const MarketingScrollingLogosConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<MarketingScrollingLogosProps>) => {
    const t = useI18n("builder");
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({
          ...data,
          style: s as MarketingScrollingLogosProps["style"],
        }),
      [setData, data],
    );
    const updateProps = useCallback(
      (p: unknown) =>
        setData({
          ...data,
          props: p as MarketingScrollingLogosProps["props"],
        }),
      [setData, data],
    );

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={marketingScrollingLogosShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        <TextInput
          label={t(
            "pageBuilder.blocks.marketingScrollingLogos.screenReaderText",
          )}
          defaultValue={data.props?.screenReaderText ?? ""}
          onChange={(screenReaderText) =>
            updateProps({
              ...data.props,
              screenReaderText,
            })
          }
        />
      </StylesConfigurationPanel>
    );
  },
);
