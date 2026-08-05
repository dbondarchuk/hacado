"use client";

import { ConfigurationProps, SliderInput } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { StylesConfigurationPanel } from "@hacado/page-builder-base";
import { Checkbox, deepMemo, Label } from "@hacado/ui";
import { Repeat1 } from "lucide-react";
import { useCallback } from "react";
import { CarouselProps, styles } from "./schema";
import { carouselShortcuts } from "./shortcuts";

export const CarouselConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<CarouselProps>) => {
    const updateProps = useCallback(
      (p: unknown) => setData({ ...data, props: p as CarouselProps["props"] }),
      [setData, data],
    );
    const updateStyle = useCallback(
      (s: unknown) => setData({ ...data, style: s as CarouselProps["style"] }),
      [setData, data],
    );
    const t = useI18n("builder");

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={carouselShortcuts}
        base={base}
        onBaseChange={onBaseChange}
      >
        {/* TODO: fix support for vertical orientation */}
        {/* <SelectInput
        label={t("pageBuilder.blocks.carousel.orientation.label")}
        options={[
          {
            value: "horizontal",
            label: t("pageBuilder.blocks.carousel.orientation.horizontal"),
          },
          {
            value: "vertical",
            label: t("pageBuilder.blocks.carousel.orientation.vertical"),
          },
        ]}
        defaultValue={data.props.orientation ?? "horizontal"}
        onChange={(orientation) =>
          updateData({ ...data, props: { ...data.props, orientation } })
        }
      /> */}
        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id="navigation"
            checked={!!data.props.navigation}
            onCheckedChange={(navigation) =>
              updateProps({ ...data.props, navigation })
            }
          />
          <Label htmlFor="navigation">
            {t("pageBuilder.blocks.carousel.navigation")}
          </Label>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id="loop"
            checked={!!data.props.loop}
            onCheckedChange={(loop) => updateProps({ ...data.props, loop })}
          />
          <Label htmlFor="loop">{t("pageBuilder.blocks.carousel.loop")}</Label>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id="autoPlay"
            checked={!!data.props.autoPlay}
            onCheckedChange={(checked) =>
              updateProps({ ...data.props, autoPlay: checked ? 5 : null })
            }
          />
          <Label htmlFor="autoPlay">
            {t("pageBuilder.blocks.carousel.autoPlay")}
          </Label>
        </div>
        {data.props.autoPlay && (
          <SliderInput
            defaultValue={data.props.autoPlay}
            onChange={(value) =>
              updateProps({ ...data.props, autoPlay: value })
            }
            label={t("pageBuilder.blocks.carousel.autoPlaySpeed")}
            iconLabel={<Repeat1 />}
            units={t("pageBuilder.blocks.carousel.autoPlaySeconds")}
            min={1}
            max={30}
            step={1}
          />
        )}
      </StylesConfigurationPanel>
    );
  },
);
