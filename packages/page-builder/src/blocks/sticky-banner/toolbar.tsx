import { ConfigurationProps } from "@hacado/builder";
import { ShortcutsToolbar } from "@hacado/page-builder-base";
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
