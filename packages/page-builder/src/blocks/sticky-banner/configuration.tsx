"use client";

import { ConfigurationProps, SelectInput } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { StylesConfigurationPanel } from "@hacado/page-builder-base";
import { Checkbox, deepMemo, Label } from "@hacado/ui";
import { useCallback, useMemo } from "react";
import {
  showStickyBannerType,
  stickyBannerPositionType,
  StickyBannerProps,
} from "./schema";
import { stickyBannerShortcuts } from "./shortcuts";
import { styles } from "./styles";

export const StickyBannerConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<StickyBannerProps>) => {
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as StickyBannerProps["style"] }),
      [setData, data],
    );

    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as StickyBannerProps["props"] }),
      [setData, data],
    );

    const t = useI18n("builder");

    const showOptions = useMemo(() => {
      return showStickyBannerType.map((show) => ({
        value: show,
        label: t(`pageBuilder.blocks.stickyBanner.show.${show}`),
      }));
    }, [t]);

    const positionOptions = useMemo(() => {
      return stickyBannerPositionType.map((position) => ({
        value: position,
        label: t(`pageBuilder.blocks.stickyBanner.position.${position}`),
      }));
    }, [t]);

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={stickyBannerShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        <SelectInput
          label={t("pageBuilder.blocks.stickyBanner.show.label")}
          defaultValue={data.props.show}
          onChange={(show) => updateProps({ ...data.props, show })}
          options={showOptions}
        />
        <SelectInput
          label={t("pageBuilder.blocks.stickyBanner.position.label")}
          defaultValue={data.props.position}
          onChange={(position) => updateProps({ ...data.props, position })}
          options={positionOptions}
        />
        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id="showCloseButton"
            checked={data.props.showCloseButton ?? true}
            onCheckedChange={(showCloseButton) =>
              updateProps({ ...data.props, showCloseButton })
            }
          />
          <Label htmlFor="showCloseButton">
            {t("pageBuilder.blocks.stickyBanner.showCloseButton.label")}
          </Label>
        </div>
      </StylesConfigurationPanel>
    );
  },
);
