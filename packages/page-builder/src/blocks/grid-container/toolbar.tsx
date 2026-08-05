import { ConfigurationProps } from "@hacado/builder";
import { ShortcutsToolbar } from "@hacado/page-builder-base";
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
