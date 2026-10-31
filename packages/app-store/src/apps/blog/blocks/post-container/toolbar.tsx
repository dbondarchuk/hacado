import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { containerShortcuts } from "../shortcuts";
import { BlogPostContainerProps } from "./schema";

export const BlogPostContainerToolbar = (
  props: ConfigurationProps<BlogPostContainerProps>,
) => (
  <ShortcutsToolbar
    shortcuts={containerShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
