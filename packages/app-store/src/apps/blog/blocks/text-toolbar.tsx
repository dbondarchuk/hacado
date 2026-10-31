import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { blogTextShortcuts } from "./text-shortcuts";

export const BlogTextToolbar = <T extends { style?: unknown }>(
  props: ConfigurationProps<T>,
) => (
  <ShortcutsToolbar
    shortcuts={blogTextShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
