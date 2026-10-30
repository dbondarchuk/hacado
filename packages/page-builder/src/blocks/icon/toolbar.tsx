import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { IconProps } from "./schema";
import { iconShortcuts } from "./shortcuts";

export const IconToolbar = (props: ConfigurationProps<IconProps>) => {
  return (
    <ShortcutsToolbar
      shortcuts={iconShortcuts}
      data={props.data}
      setData={props.setData}
    />
  );
};
