import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { TextProps } from "./schema";
import { textShortcuts } from "./shortcuts";

export const TextToolbar = (props: ConfigurationProps<TextProps>) => (
  <ShortcutsToolbar
    shortcuts={textShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
