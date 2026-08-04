"use client";

import {
  AppSelectorInput,
  BooleanInput,
  ConfigurationProps,
  PageInput,
  SelectInput,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { StylesConfigurationPanel } from "@timelish/page-builder-base";
import { deepMemo } from "@timelish/ui";
import { useCallback } from "react";
import { WAITLIST_APP_NAME } from "../../../const";
import {
  WaitlistAdminKeys,
  WaitlistAdminNamespace,
  waitlistAdminNamespace,
} from "../../../translations/types";
import { BookingWithWaitlistProps } from "./schema";
import { bookingWithWaitlistShortcuts } from "./shortcuts";
import { styles } from "./styles";

export const BookingWithWaitlistConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
    metadata,
    onMetadataChange,
  }: ConfigurationProps<BookingWithWaitlistProps>) => {
    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as BookingWithWaitlistProps["props"] }),
      [setData, data],
    );
    const t = useI18n("builder");
    const tAdmin = useI18n<WaitlistAdminNamespace, WaitlistAdminKeys>(
      waitlistAdminNamespace,
    );

    const updateMetadata = useCallback(
      (m: Record<string, any>) => onMetadataChange?.(m),
      [onMetadataChange],
    );

    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as BookingWithWaitlistProps["style"] }),
      [setData, data],
    );

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={bookingWithWaitlistShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        <AppSelectorInput
          label={tAdmin("block.waitlistAppId.label")}
          helperText={tAdmin("block.waitlistAppId.tooltip")}
          defaultValue={metadata?.waitlistAppId ?? ""}
          appName={WAITLIST_APP_NAME}
          nullable
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
        <PageInput
          label={t("pageBuilder.blocks.booking.confirmationPage")}
          defaultValue={data.props.confirmationPage ?? null}
          nullable
          onChange={(value) =>
            updateProps({ ...data.props, confirmationPage: value })
          }
        />
        <SelectInput
          label={t("pageBuilder.blocks.booking.flowOrder.label")}
          defaultValue={data.props.flowOrder ?? "service-first"}
          onChange={(value) =>
            updateProps({ ...data.props, flowOrder: value as any })
          }
          options={[
            {
              value: "service-first",
              label: t("pageBuilder.blocks.booking.flowOrder.serviceFirst"),
            },
            {
              value: "specialist-first",
              label: t("pageBuilder.blocks.booking.flowOrder.specialistFirst"),
            },
          ]}
        />
      </StylesConfigurationPanel>
    );
  },
);
