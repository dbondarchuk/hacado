"use client";

import { ConfigurationProps, TextInput } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { StylesConfigurationPanel } from "@hacado/page-builder-base";
import { Checkbox, DurationInput, Label, deepMemo } from "@hacado/ui";
import { useCallback } from "react";
import { YouTubeVideoProps } from "./schema";
import { youtubeVideoShortcuts } from "./shortcuts";
import { styles } from "./styles";

export const YouTubeVideoConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
  }: ConfigurationProps<YouTubeVideoProps>) => {
    const updateData = useCallback(
      (d: unknown) => setData(d as YouTubeVideoProps),
      [setData],
    );
    const updateProps = useCallback(
      (p: unknown) =>
        setData({ ...data, props: p as YouTubeVideoProps["props"] }),
      [setData, data],
    );
    const updateStyle = useCallback(
      (s: unknown) =>
        setData({ ...data, style: s as YouTubeVideoProps["style"] }),
      [setData, data],
    );

    const t = useI18n("builder");
    const props = data.props || {};

    return (
      <StylesConfigurationPanel
        styles={data.style ?? {}}
        onStylesChange={updateStyle}
        availableStyles={styles}
        shortcuts={youtubeVideoShortcuts}
        props={props}
        onPropsChange={updateProps}
        base={base}
        onBaseChange={onBaseChange}
      >
        <TextInput
          label={t("pageBuilder.blocks.youtubeVideo.url")}
          defaultValue={data.props?.youtubeUrl ?? ""}
          onChange={(youtubeUrl) =>
            updateData({ ...data, props: { ...data.props, youtubeUrl } })
          }
        />

        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id="privacy"
            checked={!!data.props?.privacy}
            onCheckedChange={(privacy) =>
              updateData({ ...data, props: { ...data.props, privacy } })
            }
          />
          <Label htmlFor="privacy">
            {t("pageBuilder.blocks.youtubeVideo.privacy")}
          </Label>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id="autoplay"
            checked={!!data.props?.autoplay}
            onCheckedChange={(autoplay) =>
              updateData({ ...data, props: { ...data.props, autoplay } })
            }
          />
          <Label htmlFor="autoplay">
            {t("pageBuilder.blocks.youtubeVideo.autoplay")}
          </Label>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id="controls"
            checked={!!data.props?.controls}
            onCheckedChange={(controls) =>
              updateData({ ...data, props: { ...data.props, controls } })
            }
          />
          <Label htmlFor="controls">
            {t("pageBuilder.blocks.youtubeVideo.controls")}
          </Label>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id="loop"
            checked={!!data.props?.loop}
            onCheckedChange={(loop) =>
              updateData({ ...data, props: { ...data.props, loop } })
            }
          />
          <Label htmlFor="loop">
            {t("pageBuilder.blocks.youtubeVideo.loop")}
          </Label>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id="muted"
            checked={!!data.props?.muted}
            onCheckedChange={(muted) =>
              updateData({ ...data, props: { ...data.props, muted } })
            }
          />
          <Label htmlFor="muted">
            {t("pageBuilder.blocks.youtubeVideo.muted")}
          </Label>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id="modestbranding"
            checked={!!data.props?.modestbranding}
            onCheckedChange={(modestbranding) =>
              updateData({ ...data, props: { ...data.props, modestbranding } })
            }
          />
          <Label htmlFor="modestbranding">
            {t("pageBuilder.blocks.youtubeVideo.modestbranding")}
          </Label>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id="showInfo"
            checked={!!data.props?.showInfo}
            onCheckedChange={(showInfo) =>
              updateData({ ...data, props: { ...data.props, showInfo } })
            }
          />
          <Label htmlFor="showInfo">
            {t("pageBuilder.blocks.youtubeVideo.showInfo")}
          </Label>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <Checkbox
            id="rel"
            checked={!!data.props?.rel}
            onCheckedChange={(rel) =>
              updateData({ ...data, props: { ...data.props, rel } })
            }
          />
          <Label htmlFor="rel">
            {t("pageBuilder.blocks.youtubeVideo.rel")}
          </Label>
        </div>

        {/* <TextInput
        label={t("pageBuilder.blocks.youtubeVideo.start")}
        defaultValue={data.props?.start ?? ""}
        onChange={(start) =>
          updateData({ ...data, props: { ...data.props, start } })
        }
      /> */}

        <div className="flex flex-col gap-2">
          <Label htmlFor="start">
            {t("pageBuilder.blocks.youtubeVideo.start")}
          </Label>
          <div className="flex w-full">
            <DurationInput
              type="minutes-seconds"
              value={props.start}
              h="sm"
              className="w-full"
              onChange={(start) =>
                updateData({ ...data, props: { ...props, start } })
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="end">
            {t("pageBuilder.blocks.youtubeVideo.end")}
          </Label>
          <div className="flex w-full">
            <DurationInput
              type="minutes-seconds"
              value={props.end}
              h="sm"
              className="w-full"
              onChange={(end) =>
                updateData({ ...data, props: { ...props, end } })
              }
            />
          </div>
        </div>
      </StylesConfigurationPanel>
    );
  },
);
