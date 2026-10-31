import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { containerShortcuts } from "../container/shortcuts";
import { ForeachContainerProps } from "./schema";

export const ForeachContainerToolbar = (
  props: ConfigurationProps<ForeachContainerProps>,
) => (
  <ShortcutsToolbar
    shortcuts={containerShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
