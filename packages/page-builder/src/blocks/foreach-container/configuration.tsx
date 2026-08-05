"use client";

import { ConfigurationProps, TextInput } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import {
  RawNumberInput,
  StylesConfigurationPanel,
} from "@hacado/page-builder-base";
import { deepMemo } from "@hacado/ui";
import { useCallback } from "react";
import { containerShortcuts } from "../container/shortcuts";
import { ForeachContainerProps, styles } from "./schema";

export const ForeachContainerConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<ForeachContainerProps>) => {
    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as ForeachContainerProps["props"] }),
      [setData, data],
    );
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as ForeachContainerProps["style"] }),
      [setData, data],
    );

    const t = useI18n("builder");
    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={containerShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        <TextInput
          label={t("pageBuilder.blocks.foreachContainer.value")}
          defaultValue={data.props?.value ?? ""}
          onChange={(value) => updateProps({ ...data.props, value })}
        />
        <TextInput
          label={t("pageBuilder.blocks.foreachContainer.itemName")}
          helperText={t(
            "pageBuilder.blocks.foreachContainer.itemNameHelperText",
          )}
          defaultValue={data.props?.itemName ?? ""}
          onChange={(itemName) => updateProps({ ...data.props, itemName })}
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("pageBuilder.blocks.foreachContainer.skip")}
          </label>
          <p className="text-xs text-muted-foreground">
            {t("pageBuilder.blocks.foreachContainer.skipHelperText")}
          </p>
          <RawNumberInput
            iconLabel={<></>}
            value={data.props?.skip ?? null}
            setValue={(value: number | null) =>
              updateProps({ ...data.props, skip: value ?? undefined })
            }
            step={1}
            min={0}
            options={[0, 1, 5, 10]}
            nullable
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            {t("pageBuilder.blocks.foreachContainer.take")}
          </label>
          <p className="text-xs text-muted-foreground">
            {t("pageBuilder.blocks.foreachContainer.takeHelperText")}
          </p>
          <RawNumberInput
            iconLabel={<></>}
            value={data.props?.take ?? null}
            setValue={(value: number | null) =>
              updateProps({ ...data.props, take: value ?? undefined })
            }
            step={1}
            min={0}
            options={[1, 3, 5, 10]}
            nullable
          />
        </div>
      </StylesConfigurationPanel>
    );
  },
);
