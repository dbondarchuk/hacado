import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { PopupProps } from "./schema";
import { popupShortcuts } from "./shortcuts";

export const PopupToolbar = (props: ConfigurationProps<PopupProps>) => (
  <ShortcutsToolbar
    shortcuts={popupShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
