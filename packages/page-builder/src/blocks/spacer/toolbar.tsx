import { ConfigurationProps } from "@hacado/builder";
import { ShortcutsToolbar } from "@hacado/page-builder-base";
import { SpacerProps } from "./schema";
import { spacerShortcuts } from "./shortcuts";

export const SpacerToolbar = (props: ConfigurationProps<SpacerProps>) => (
  <ShortcutsToolbar
    shortcuts={spacerShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
