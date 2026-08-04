import { ConfigurationProps } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { ShortcutsToolbar } from "@timelish/page-builder-base";
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
