"use client";

import {
  ConfigurationProps,
  SelectInput,
  SliderInput,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { Checkbox, deepMemo, Label } from "@timelish/ui";
import { Repeat1 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { LightboxProps, overlayType } from "./schema";

export const LightboxConfiguration = deepMemo(
  ({ data, setData }: ConfigurationProps<LightboxProps>) => {
    const updateProps = useCallback(
      (p: unknown) => setData({ ...data, props: p as LightboxProps["props"] }),
      [setData, data],
    );

    const t = useI18n("builder");
    const overlayOptions = useMemo(() => {
      return overlayType.map((overlay) => ({
        value: overlay,
        label: t(`pageBuilder.blocks.lightbox.overlay.${overlay}`),
      }));
    }, [t]);

    return (
      <div className="grid grid-cols-1 gap-4">
        <SelectInput
          label={t("pageBuilder.blocks.lightbox.overlay.label")}
          defaultValue={data.props.overlay}
          onChange={(overlay) => updateProps({ ...data.props, overlay })}
          options={overlayOptions}
        />
        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id="showAltAsDescription"
            checked={!!data.props.showAltAsDescription}
            onCheckedChange={(showAltAsDescription) =>
              updateProps({ ...data.props, showAltAsDescription })
            }
          />
          <Label htmlFor="showAltAsDescription">
            {t("pageBuilder.blocks.lightbox.showAltAsDescription")}
          </Label>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id="navigation"
            checked={!!data.props.navigation}
            onCheckedChange={(navigation) =>
              updateProps({ ...data.props, navigation })
            }
          />
          <Label htmlFor="navigation">
            {t("pageBuilder.blocks.lightbox.navigation")}
          </Label>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id="loop"
            checked={!!data.props.loop}
            onCheckedChange={(loop) => updateProps({ ...data.props, loop })}
          />
          <Label htmlFor="loop">{t("pageBuilder.blocks.lightbox.loop")}</Label>
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
            {t("pageBuilder.blocks.lightbox.autoPlay")}
          </Label>
        </div>
        {data.props.autoPlay && (
          <SliderInput
            defaultValue={data.props.autoPlay}
            onChange={(value) =>
              updateProps({ ...data.props, autoPlay: value })
            }
            label={t("pageBuilder.blocks.lightbox.autoPlaySpeed")}
            iconLabel={<Repeat1 />}
            units={t("pageBuilder.blocks.lightbox.autoPlaySeconds")}
            min={1}
            max={30}
            step={1}
          />
        )}
      </div>
    );
  },
);
