import { ConfigurationProps } from "@hacado/builder";
import { ShortcutsToolbar } from "@hacado/page-builder-base";
import { BeforeAfterProps } from "./schema";
import { beforeAfterShortcuts } from "./shortcuts";

export const BeforeAfterToolbar = (
  props: ConfigurationProps<BeforeAfterProps>,
) => {
  return (
    <>
      <ShortcutsToolbar
        shortcuts={beforeAfterShortcuts}
        data={props.data}
        setData={props.setData}
      />
    </>
  );
};
