"use client";

import { ConfigurationProps } from "@hacado/builder";
import { ShortcutsToolbar } from "@hacado/page-builder-base";
import { VideoProps } from "./schema";
import { videoShortcuts } from "./shortcuts";

export const VideoToolbar = (props: ConfigurationProps<VideoProps>) => (
  <ShortcutsToolbar
    shortcuts={videoShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
