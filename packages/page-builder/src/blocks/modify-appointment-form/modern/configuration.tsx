"use client";

import { BooleanInput, ConfigurationProps } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { StylesConfigurationPanel } from "@hacado/page-builder-base";
import { deepMemo } from "@hacado/ui";
import { useCallback } from "react";
import { ModifyAppointmentFormProps } from "./schema";
import { modifyAppointmentFormShortcuts } from "./shortcuts";
import { styles } from "./styles";

export const ModifyAppointmentFormConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<ModifyAppointmentFormProps>) => {
    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as ModifyAppointmentFormProps["props"] }),
      [setData, data],
    );
    const t = useI18n("builder");

    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as ModifyAppointmentFormProps["style"] }),
      [setData, data],
    );

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={modifyAppointmentFormShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        <BooleanInput
          label={t("pageBuilder.blocks.modifyAppointmentForm.modern.hideTitle")}
          defaultValue={data.props.hideTitle ?? false}
          onChange={(value) => updateProps({ ...data.props, hideTitle: value })}
        />
        <BooleanInput
          label={t("pageBuilder.blocks.modifyAppointmentForm.modern.hideSteps")}
          defaultValue={data.props.hideSteps ?? false}
          onChange={(value) => updateProps({ ...data.props, hideSteps: value })}
        />
        <BooleanInput
          label={t(
            "pageBuilder.blocks.modifyAppointmentForm.modern.scrollToTop",
          )}
          defaultValue={data.props.scrollToTop ?? false}
          onChange={(value) =>
            updateProps({ ...data.props, scrollToTop: value })
          }
        />
      </StylesConfigurationPanel>
    );
  },
);
