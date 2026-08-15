import { ConfigurationProps } from "@hacado/builder";
import { ShortcutsToolbar } from "@hacado/page-builder-base";
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
