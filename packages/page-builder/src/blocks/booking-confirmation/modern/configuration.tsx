"use client";

import { ConfigurationProps, PageInput } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { StylesConfigurationPanel } from "@timelish/page-builder-base";
import { deepMemo } from "@timelish/ui";
import { useCallback } from "react";
import { BookingConfirmationProps } from "./schema";
import { styles } from "./styles";

export const BookingConfirmationConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<BookingConfirmationProps>) => {
    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as BookingConfirmationProps["props"] }),
      [setData, data],
    );

    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as BookingConfirmationProps["style"] }),
      [setData, data],
    );

    const t = useI18n("builder");

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        base={base}
        onBaseChange={onBaseChange}
      >
        <PageInput
          label={t(
            "pageBuilder.blocks.bookingConfirmation.modern.newBookingPage",
          )}
          defaultValue={data.props.newBookingPage ?? null}
          nullable
          onChange={(value) =>
            updateProps({ ...data.props, newBookingPage: value })
          }
        />
      </StylesConfigurationPanel>
    );
  },
);
