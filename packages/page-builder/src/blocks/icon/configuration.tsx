"use client";

import { ConfigurationProps } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { StylesConfigurationPanel } from "@timelish/page-builder-base";
import {
  ComboboxAsync,
  deepMemo,
  IComboboxItem,
  Icon,
  iconNames,
  Label,
  type IconName,
} from "@timelish/ui";
import { capitalize } from "@timelish/utils";
import { useCallback } from "react";
import { IconProps, IconPropsDefaults } from "./schema";
import { iconShortcuts } from "./shortcuts";
import { styles } from "./styles";

function transformIconName(iconName: IconName): string {
  return iconName
    .split("-")
    .map((word) => capitalize(word))
    .join(" ");
}

export const IconConfiguration = deepMemo(
  ({ data, setData, base, onBaseChange }: ConfigurationProps<IconProps>) => {
    const t = useI18n("builder");
    const updateProps = useCallback(
      (p: unknown) => setData({ ...data, props: p as IconProps["props"] }),
      [setData, data],
    );
    const updateStyle = useCallback(
      (s: unknown) => setData({ ...data, style: s as IconProps["style"] }),
      [setData, data],
    );

    const icon = (data.props as any)?.icon ?? IconPropsDefaults.props.icon;

    const getIcons = useCallback(
      async (page: number, search?: string) => {
        const limit = 20;
        let filteredIcons: IconName[] = [...iconNames];
        const valueIndex = filteredIcons.indexOf(icon);
        if (valueIndex !== -1) {
          const currentIcon = filteredIcons[valueIndex];
          filteredIcons.splice(valueIndex, 1);
          filteredIcons.unshift(currentIcon);
        }

        if (search) {
          filteredIcons = filteredIcons.filter(
            (iconName) =>
              iconName.toLowerCase().includes(search.toLowerCase()) ||
              transformIconName(iconName)
                .toLowerCase()
                .includes(search.toLowerCase()),
          );
        }

        const items: IComboboxItem[] = filteredIcons
          .slice((page - 1) * limit, page * limit)
          .map((iconName) => ({
            value: iconName,
            label: (
              <div className="flex flex-row gap-2 items-center">
                <Icon name={iconName} size={16} />
                <span>{transformIconName(iconName)}</span>
              </div>
            ),
          }));

        return {
          items: items,
          hasMore: page * limit < iconNames.length,
        };
      },
      [icon],
    );

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={iconShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="icon">{t("pageBuilder.blocks.icon.icon")}</Label>
          <ComboboxAsync
            id="icon"
            fetchItems={getIcons}
            value={icon ?? ""}
            size="sm"
            className="w-full"
            onChange={(value) => updateProps({ ...data.props, icon: value })}
          />
        </div>
      </StylesConfigurationPanel>
    );
  },
);
