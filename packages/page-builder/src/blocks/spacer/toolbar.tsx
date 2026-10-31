import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { SpacerProps } from "./schema";
import { spacerShortcuts } from "./shortcuts";

export const SpacerToolbar = (props: ConfigurationProps<SpacerProps>) => (
  <ShortcutsToolbar
    shortcuts={spacerShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
