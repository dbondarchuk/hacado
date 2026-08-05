import { ConfigurationProps } from "@hacado/builder";
import { ShortcutsToolbar } from "@hacado/page-builder-base";
import { PageHeroProps } from "./schema";
import { pageHeroShortcuts } from "./shortcuts";

export const PageHeroToolbar = (props: ConfigurationProps<PageHeroProps>) => (
  <ShortcutsToolbar
    shortcuts={pageHeroShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
