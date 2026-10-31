"use client";

import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { VideoProps } from "./schema";
import { videoShortcuts } from "./shortcuts";

export const VideoToolbar = (props: ConfigurationProps<VideoProps>) => (
  <ShortcutsToolbar
    shortcuts={videoShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
