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
import { WAITLIST_APP_NAME } from "../../../const";
import {
  WaitlistAdminKeys,
  WaitlistAdminNamespace,
  waitlistAdminNamespace,
} from "../../../translations/types";
import { WaitlistProps } from "./schema";
import { waitlistShortcuts } from "./shortcuts";
import { styles } from "./styles";

export const WaitlistConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
    metadata,
    onMetadataChange,
  }: ConfigurationProps<WaitlistProps>) => {
    const t = useI18n("builder");
    const tAdmin = useI18n<WaitlistAdminNamespace, WaitlistAdminKeys>(
      waitlistAdminNamespace,
    );

    const updateStyle = useCallback(
      (s: unknown) => setData({ ...data, style: s as WaitlistProps["style"] }),
      [setData, data],
    );
    const updateProps = useCallback(
      (p: unknown) => setData({ ...data, props: p as WaitlistProps["props"] }),
      [setData, data],
    );

    const updateMetadata = useCallback(
      (m: Record<string, any>) => onMetadataChange(m),
      [onMetadataChange],
    );

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={waitlistShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        <AppSelectorInput
          label={tAdmin("block.waitlistAppId.label")}
          helperText={tAdmin("block.waitlistAppId.tooltip")}
          defaultValue={metadata?.waitlistAppId ?? ""}
          appName={WAITLIST_APP_NAME}
          onChange={(value) =>
            updateMetadata({ ...metadata, waitlistAppId: value })
          }
        />
        <BooleanInput
          label={t("pageBuilder.blocks.booking.modern.hideTitle")}
          defaultValue={data.props.hideTitle ?? false}
          onChange={(value) => updateProps({ ...data.props, hideTitle: value })}
        />
        <BooleanInput
          label={t("pageBuilder.blocks.booking.modern.hideSteps")}
          defaultValue={data.props.hideSteps ?? false}
          onChange={(value) => updateProps({ ...data.props, hideSteps: value })}
        />
        <BooleanInput
          label={t("pageBuilder.blocks.booking.modern.scrollToTop")}
          defaultValue={data.props.scrollToTop ?? false}
          onChange={(value) =>
            updateProps({ ...data.props, scrollToTop: value })
          }
        />
      </StylesConfigurationPanel>
    );
  },
);
