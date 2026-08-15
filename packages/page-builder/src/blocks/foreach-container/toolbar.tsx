import { ConfigurationProps } from "@hacado/builder";
import { ShortcutsToolbar } from "@hacado/page-builder-base";
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
