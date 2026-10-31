import { ConfigurationProps } from "@hacado/builder/types";
import { ShortcutsToolbar } from "@hacado/page-builder-base/toolbars";
import { CarouselProps } from "./schema";
import { carouselShortcuts } from "./shortcuts";

export const CarouselToolbar = (props: ConfigurationProps<CarouselProps>) => (
  <ShortcutsToolbar
    shortcuts={carouselShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
