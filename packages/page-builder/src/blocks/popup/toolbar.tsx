import { ConfigurationProps } from "@hacado/builder";
import { ShortcutsToolbar } from "@hacado/page-builder-base";
import { PopupProps } from "./schema";
import { popupShortcuts } from "./shortcuts";

export const PopupToolbar = (props: ConfigurationProps<PopupProps>) => (
  <ShortcutsToolbar
    shortcuts={popupShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
