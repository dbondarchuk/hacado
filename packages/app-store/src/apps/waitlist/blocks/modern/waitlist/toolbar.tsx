import { ConfigurationProps } from "@hacado/builder";
import { ShortcutsToolbar } from "@hacado/page-builder-base";
import { WaitlistProps } from "./schema";
import { waitlistShortcuts } from "./shortcuts";

export const WaitlistToolbar = (props: ConfigurationProps<WaitlistProps>) => (
  <ShortcutsToolbar
    shortcuts={waitlistShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
