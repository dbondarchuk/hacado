"use client";

import { ConfigurationProps, SelectInput } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { StylesConfigurationPanel } from "@timelish/page-builder-base";
import { Checkbox, deepMemo, Label } from "@timelish/ui";
import { useCallback, useMemo } from "react";
import { overlayType, PopupProps, showPopupType } from "./schema";
import { popupShortcuts } from "./shortcuts";
import { styles } from "./styles";

export const PopupConfiguration = deepMemo(
  ({ data, setData, base, onBaseChange }: ConfigurationProps<PopupProps>) => {
    const updateStyle = useCallback(
      (s: unknown) => setData({ ...data, style: s as PopupProps["style"] }),
      [setData, data],
    );

    const updateProps = useCallback(
      (p: unknown) => setData({ ...data, props: p as PopupProps["props"] }),
      [setData, data],
    );

    const t = useI18n("builder");

    const showOptions = useMemo(() => {
      return showPopupType.map((show) => ({
        value: show,
        label: t(`pageBuilder.blocks.popup.show.${show}`),
      }));
    }, [t]);

    const overlayOptions = useMemo(() => {
      return overlayType.map((overlay) => ({
        value: overlay,
        label: t(`pageBuilder.blocks.popup.overlay.${overlay}`),
      }));
    }, [t]);

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={popupShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        <SelectInput
          label={t("pageBuilder.blocks.popup.show.label")}
          defaultValue={data.props.show}
          onChange={(show) => updateProps({ ...data.props, show })}
          options={showOptions}
        />
        <SelectInput
          label={t("pageBuilder.blocks.popup.overlay.label")}
          defaultValue={data.props.overlay}
          onChange={(overlay) => updateProps({ ...data.props, overlay })}
          options={overlayOptions}
        />
        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id="noClose"
            checked={!!data.props.noClose}
            onCheckedChange={(noClose) =>
              updateProps({ ...data.props, noClose })
            }
          />
          <Label htmlFor="noClose">
            {t("pageBuilder.blocks.popup.noClose.label")}
          </Label>
        </div>
      </StylesConfigurationPanel>
    );
  },
);
