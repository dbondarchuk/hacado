import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { StickyBannerProps } from "./schema";
import { stickyBannerShortcuts } from "./shortcuts";

export const StickyBannerToolbar = (
  props: ConfigurationProps<StickyBannerProps>,
) => (
  <ShortcutsToolbar
    shortcuts={stickyBannerShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
