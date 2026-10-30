import { ConfigurationProps } from "@hacado/builder/types";
import { useI18n } from "@hacado/i18n/client";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { PhraseCycleProps } from "./schema";
import { phraseCycleShortcuts } from "./shortcuts";

export const PhraseCycleToolbar = (
  props: ConfigurationProps<PhraseCycleProps>,
) => {
  const t = useI18n("builder");

  return (
    <>
      <ShortcutsToolbar
        shortcuts={phraseCycleShortcuts}
        data={props.data}
        setData={props.setData}
      />
    </>
  );
};
