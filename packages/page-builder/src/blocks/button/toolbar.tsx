import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { ButtonProps } from "./schema";
import { buttonShortcuts } from "./shortcuts";

export const ButtonToolbar = (props: ConfigurationProps<ButtonProps>) => {
  return (
    <ShortcutsToolbar
      shortcuts={buttonShortcuts}
      data={props.data}
      setData={props.setData}
    />
  );
};
