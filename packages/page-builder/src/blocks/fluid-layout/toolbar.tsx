import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { FluidLayoutProps } from "./schema";
import { fluidLayoutShortcuts } from "./shortcuts";

export const FluidLayoutToolbar = (
  props: ConfigurationProps<FluidLayoutProps>,
) => (
  <ShortcutsToolbar
    shortcuts={fluidLayoutShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
