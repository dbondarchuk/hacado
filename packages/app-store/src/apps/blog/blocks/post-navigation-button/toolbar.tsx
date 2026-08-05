import { ConfigurationProps } from "@hacado/builder";
import { ShortcutsToolbar } from "@hacado/page-builder-base";
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
