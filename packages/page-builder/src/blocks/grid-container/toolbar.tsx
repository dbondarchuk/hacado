import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { GridContainerProps } from "./schema";
import { gridContainerShortcuts } from "./shortcuts";

export const GridContainerToolbar = (
  props: ConfigurationProps<GridContainerProps>,
) => (
  <>
    <ShortcutsToolbar
      shortcuts={gridContainerShortcuts}
      data={props.data}
      setData={props.setData}
    />
  </>
);
