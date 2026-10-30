import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { containerShortcuts } from "../shortcuts";
import { BlogPostsContainerProps } from "./schema";

export const BlogPostsContainerToolbar = (
  props: ConfigurationProps<BlogPostsContainerProps>,
) => (
  <ShortcutsToolbar
    shortcuts={containerShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
