import { ConfigurationProps } from "@hacado/builder";
import { ShortcutsToolbar } from "@hacado/page-builder-base";
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
