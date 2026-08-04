"use client";

import {
  AppSelectorInput,
  BooleanInput,
  ConfigurationProps,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { StylesConfigurationPanel } from "@timelish/page-builder-base";
import { deepMemo } from "@timelish/ui";
import { useCallback } from "react";
import { MY_CABINET_APP_NAME } from "../../const";
import {
  MyCabinetAdminKeys,
  MyCabinetAdminNamespace,
  myCabinetAdminNamespace,
} from "../../translations/types";
import {
  MyCabinetBlockProps,
  MyCabinetBlockPropsDefaults,
  styles,
} from "./schema";

export const MyCabinetBlockConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
    metadata,
    onMetadataChange,
  }: ConfigurationProps<MyCabinetBlockProps>) => {
    const t = useI18n<MyCabinetAdminNamespace, MyCabinetAdminKeys>(
      myCabinetAdminNamespace,
    );

    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as MyCabinetBlockProps["style"] }),
      [setData, data],
    );
    const updateMetadata = useCallback(
      (m: Record<string, unknown>) => onMetadataChange(m),
      [onMetadataChange],
    );
    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as MyCabinetBlockProps["props"] }),
      [setData, data],
    );
    const appId = (metadata?.myCabinetAppId as string) ?? "";

    return (
      <StylesConfigurationPanel
        styles={data.style ?? MyCabinetBlockPropsDefaults.style}
        onStylesChange={updateStyle}
        availableStyles={styles}
        base={base}
        onBaseChange={onBaseChange}
      >
        <AppSelectorInput
          label={t("block.myCabinetAppId.label")}
          helperText={t("block.myCabinetAppId.helperText")}
          appName={MY_CABINET_APP_NAME}
          defaultValue={appId}
          onChange={(value) =>
            updateMetadata({ ...metadata, myCabinetAppId: value ?? "" })
          }
        />
        <BooleanInput
          label={t("block.showTitle.label")}
          defaultValue={data.props?.showTitle ?? true}
          onChange={(value) =>
            updateProps({
              ...(data.props ?? {}),
              showTitle: value,
            })
          }
        />
        <BooleanInput
          label={t("block.scrollToTop.label")}
          defaultValue={data.props?.scrollToTop ?? true}
          onChange={(value) =>
            updateProps({
              ...(data.props ?? {}),
              scrollToTop: value,
            })
          }
        />
      </StylesConfigurationPanel>
    );
  },
);
