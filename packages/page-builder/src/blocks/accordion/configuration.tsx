"use client";

import { ConfigurationProps, SelectInput } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { StylesConfigurationPanel } from "@timelish/page-builder-base";
import { deepMemo } from "@timelish/ui";
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
