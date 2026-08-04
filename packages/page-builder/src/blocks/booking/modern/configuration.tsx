"use client";

import {
  BooleanInput,
  ConfigurationProps,
  PageInput,
  SelectInput,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { StylesConfigurationPanel } from "@timelish/page-builder-base";
import { deepMemo } from "@timelish/ui";
import { useCallback } from "react";
import { BookingProps } from "./schema";
import { bookingShortcuts } from "./shortcuts";
import { styles } from "./styles";

export const BookingConfiguration = deepMemo(
  ({ data, setData, base, onBaseChange }: ConfigurationProps<BookingProps>) => {
    const updateProps = useCallback(
      (p: unknown) => setData({ ...data, props: p as BookingProps["props"] }),
      [setData, data],
    );
    const t = useI18n("builder");

    const updateStyle = useCallback(
      (s: unknown) => setData({ ...data, style: s as BookingProps["style"] }),
      [setData, data],
    );

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={bookingShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
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
