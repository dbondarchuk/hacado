import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { ContainerProps } from "./schema";
import { containerShortcuts } from "./shortcuts";

export const ContainerToolbar = (props: ConfigurationProps<ContainerProps>) => (
  <ShortcutsToolbar
    shortcuts={containerShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
