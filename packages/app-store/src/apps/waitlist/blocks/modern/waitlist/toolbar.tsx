import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { WaitlistProps } from "./schema";
import { waitlistShortcuts } from "./shortcuts";

export const WaitlistToolbar = (props: ConfigurationProps<WaitlistProps>) => (
  <ShortcutsToolbar
    shortcuts={waitlistShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
