"use client";

import { ConfigurationProps, TextInput } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { StylesConfigurationPanel } from "@timelish/page-builder-base";
import { deepMemo } from "@timelish/ui";
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
