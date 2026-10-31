import { ConfigurationProps } from "@hacado/builder/types";
import { useI18n } from "@hacado/i18n/client";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { InlineTextProps } from "./schema";
import { inlineTextShortcuts } from "./shortcuts";

export const InlineTextToolbar = (
  props: ConfigurationProps<InlineTextProps>,
) => {
  const t = useI18n("builder");

  return (
    <>
      <ShortcutsToolbar
        shortcuts={inlineTextShortcuts}
        data={props.data}
        setData={props.setData}
      />
    </>
  );
};
