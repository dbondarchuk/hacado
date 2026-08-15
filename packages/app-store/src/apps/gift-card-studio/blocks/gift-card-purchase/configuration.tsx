"use client";

import {
  AppSelectorInput,
  BooleanInput,
  ConfigurationProps,
} from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { StylesConfigurationPanel } from "@hacado/page-builder-base";
import { deepMemo } from "@hacado/ui";
import { useCallback } from "react";
import { GIFT_CARD_STUDIO_APP_NAME } from "../../const";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import {
  GiftCardPurchaseBlockProps,
  GiftCardPurchaseBlockPropsDefaults,
  styles,
} from "./schema";

export const GiftCardPurchaseBlockConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
    metadata,
    onMetadataChange,
  }: ConfigurationProps<GiftCardPurchaseBlockProps>) => {
    const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
      giftCardStudioAdminNamespace,
    );

    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as GiftCardPurchaseBlockProps["style"] }),
      [setData, data],
    );
    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as GiftCardPurchaseBlockProps["props"] }),
      [setData, data],
    );
    const updateMetadata = useCallback(
      (m: Record<string, unknown>) => onMetadataChange(m),
      [onMetadataChange],
    );

    const appId = (metadata?.giftCardStudioAppId as string) ?? "";

    return (
      <StylesConfigurationPanel
        styles={data.style ?? GiftCardPurchaseBlockPropsDefaults.style}
        onStylesChange={updateStyle}
        availableStyles={styles}
        base={base}
        onBaseChange={onBaseChange}
      >
        <AppSelectorInput
          label={t("block.giftCardPurchase.configuration.app.label")}
          helperText={t("block.giftCardPurchase.configuration.app.helperText")}
          defaultValue={appId}
          appName={GIFT_CARD_STUDIO_APP_NAME}
          onChange={(value) =>
            updateMetadata({ ...metadata, giftCardStudioAppId: value ?? "" })
          }
        />
        <BooleanInput
          label={t("block.giftCardPurchase.configuration.hideTitle.label")}
          defaultValue={data.props?.hideTitle ?? false}
          onChange={(value) =>
            updateProps({
              ...(data.props ?? {}),
              hideTitle: value,
            })
          }
        />
        <BooleanInput
          label={t("block.giftCardPurchase.configuration.hideSteps.label")}
          defaultValue={data.props?.hideSteps ?? false}
          onChange={(value) =>
            updateProps({
              ...(data.props ?? {}),
              hideSteps: value,
            })
          }
        />
      </StylesConfigurationPanel>
    );
  },
);
