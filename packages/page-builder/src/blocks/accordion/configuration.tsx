"use client";

import { BooleanInput, ConfigurationProps, SelectInput } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { StylesConfigurationPanel } from "@hacado/page-builder-base";
import { deepMemo } from "@hacado/ui";
import { useCallback } from "react";
import { AccordionProps } from "./schema";
import { styles } from "./styles";

export const AccordionConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<AccordionProps>) => {
    const t = useI18n("builder");
    const updateProps = useCallback(
      (p: unknown) => setData({ ...data, props: p as AccordionProps["props"] }),
      [setData, data],
    );
    const updateStyle = useCallback(
      (s: unknown) => setData({ ...data, style: s as AccordionProps["style"] }),
      [setData, data],
    );

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        base={base}
        onBaseChange={onBaseChange}
      >
        <BooleanInput
          label={t("pageBuilder.blocks.accordion.allowMultipleOpen")}
          defaultValue={data.props.allowMultipleOpen ?? false}
          onChange={(allowMultipleOpen) =>
            updateProps({ ...data.props, allowMultipleOpen })
          }
        />
        <BooleanInput
          label={t("pageBuilder.blocks.accordion.defaultOpenFirst")}
          defaultValue={data.props.defaultOpenFirst ?? false}
          onChange={(defaultOpenFirst) =>
            updateProps({ ...data.props, defaultOpenFirst })
          }
        />
        <SelectInput
          label={t("pageBuilder.blocks.accordion.animation")}
          size="sm"
          defaultValue={data.props.animation ?? "none"}
          onChange={(animation) => updateProps({ ...data.props, animation })}
          options={[
            {
              value: "slide",
              label: t("pageBuilder.blocks.accordion.animations.slide"),
            },
            {
              value: "fade",
              label: t("pageBuilder.blocks.accordion.animations.fade"),
            },
            {
              value: "none",
              label: t("pageBuilder.blocks.accordion.animations.none"),
            },
          ]}
        />
        <SelectInput
          label={t("pageBuilder.blocks.accordion.iconPosition")}
          size="sm"
          defaultValue={data.props.iconPosition ?? "right"}
          onChange={(iconPosition) =>
            updateProps({ ...data.props, iconPosition })
          }
          options={[
            {
              value: "left",
              label: t("pageBuilder.blocks.accordion.iconPositions.left"),
            },
            {
              value: "right",
              label: t("pageBuilder.blocks.accordion.iconPositions.right"),
            },
          ]}
        />
        <SelectInput
          label={t("pageBuilder.blocks.accordion.iconStyle")}
          size="sm"
          defaultValue={data.props.iconStyle ?? "chevron"}
          onChange={(iconStyle) => updateProps({ ...data.props, iconStyle })}
          options={[
            {
              value: "plus",
              label: t("pageBuilder.blocks.accordion.iconStyles.plus"),
            },
            {
              value: "plus-x",
              label: t("pageBuilder.blocks.accordion.iconStyles.plusX"),
            },
            {
              value: "arrow",
              label: t("pageBuilder.blocks.accordion.iconStyles.arrow"),
            },
            {
              value: "chevron",
              label: t("pageBuilder.blocks.accordion.iconStyles.chevron"),
            },
          ]}
        />
      </StylesConfigurationPanel>
    );
  },
);
