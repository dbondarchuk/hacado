import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { BlogPostNavigationButtonProps } from "./schema";
import { blogPostNavigationButtonShortcuts } from "./shortcuts";

export const BlogPostNavigationButtonToolbar = (
  props: ConfigurationProps<BlogPostNavigationButtonProps>,
) => {
  return (
    <ShortcutsToolbar
      shortcuts={blogPostNavigationButtonShortcuts}
      data={props.data}
      setData={props.setData}
    />
  );
};
