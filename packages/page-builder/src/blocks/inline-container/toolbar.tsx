import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { InlineContainerProps } from "./schema";
import { inlineContainerShortcuts } from "./shortcuts";

export const InlineContainerToolbar = (
  props: ConfigurationProps<InlineContainerProps>,
) => (
  <ShortcutsToolbar
    shortcuts={inlineContainerShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
