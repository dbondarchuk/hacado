"use client";

import { ConfigurationProps, SelectInput } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import {
  RawNumberInputWithUnit,
  StylesConfigurationPanel,
} from "@hacado/page-builder-base";
import { Checkbox, Label } from "@hacado/ui";
import { Percent } from "lucide-react";
import { useCallback } from "react";
import { BeforeAfterProps } from "./schema";
import { beforeAfterShortcuts } from "./shortcuts";
import { styles } from "./styles";

export const BeforeAfterConfiguration = ({
  data,
  setData,
  base,
  onBaseChange,
}: ConfigurationProps<BeforeAfterProps>) => {
  const t = useI18n("builder");

  const updateStyle = useCallback(
    (s: unknown) => setData({ ...data, style: s as BeforeAfterProps["style"] }),
    [setData, data],
  );
  const updateProps = useCallback(
    (p: unknown) => setData({ ...data, props: p as BeforeAfterProps["props"] }),
    [setData, data],
  );

  return (
    <StylesConfigurationPanel
      styles={data.style ?? {}}
      onStylesChange={updateStyle}
      availableStyles={styles}
      shortcuts={beforeAfterShortcuts}
      base={base}
      onBaseChange={onBaseChange}
    >
      <div className="flex flex-col gap-2">
        <Label>
          {t("pageBuilder.blocks.beforeAfterSlider.sliderPosition")}
        </Label>
        <div className="flex w-full">
          <RawNumberInputWithUnit
            icon={<Percent className="size-4" />}
            forceUnit="%"
            nullable={false}
            min={{ "%": 0 }}
            max={{
              "%": 100,
            }}
            defaultValue={{
              value: data.props?.sliderPosition || 50,
              unit: "%",
            }}
            onChange={(value) =>
              updateProps({ ...data.props, sliderPosition: value.value })
            }
          />
        </div>
      </div>

      <SelectInput
        label={t("pageBuilder.blocks.beforeAfterSlider.orientation.label")}
        defaultValue={data.props?.orientation || "horizontal"}
        onChange={(value) =>
          updateProps({
            ...data.props,
            orientation: value as "horizontal" | "vertical",
          })
        }
        options={[
          {
            value: "horizontal",
            label: t(
              "pageBuilder.blocks.beforeAfterSlider.orientation.horizontal",
            ),
          },
          {
            value: "vertical",
            label: t(
              "pageBuilder.blocks.beforeAfterSlider.orientation.vertical",
            ),
          },
        ]}
      />
      <div className="flex items-center gap-2 flex-1">
        <Checkbox
          id="showLabels"
          checked={!!data.props?.showLabels}
          onCheckedChange={(showLabels) =>
            updateProps({ ...data.props, showLabels })
          }
        />
        <Label htmlFor="showLabels">
          {t("pageBuilder.blocks.beforeAfterSlider.showLabels")}
        </Label>
      </div>
    </StylesConfigurationPanel>
  );
};
