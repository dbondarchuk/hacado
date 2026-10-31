import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { CatalogValueProps } from "./schema";
import { catalogValueShortcuts } from "./shortcuts";

export const CatalogValueToolbar = (
  props: ConfigurationProps<CatalogValueProps>,
) => {
  return (
    <ShortcutsToolbar
      shortcuts={catalogValueShortcuts}
      data={props.data}
      setData={props.setData}
    />
  );
};
