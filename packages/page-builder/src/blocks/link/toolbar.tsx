import { ConfigurationProps } from "@hacado/builder/types";
import { useI18n } from "@hacado/i18n/client";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { LinkProps } from "./schema";
import { linkShortcuts } from "./shortcuts";

export const LinkToolbar = (props: ConfigurationProps<LinkProps>) => {
  const t = useI18n("builder");

  return (
    <>
      <ShortcutsToolbar
        shortcuts={linkShortcuts}
        data={props.data}
        setData={props.setData}
      />
    </>
  );
};
