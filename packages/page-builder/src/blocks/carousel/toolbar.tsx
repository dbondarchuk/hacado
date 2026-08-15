import { ConfigurationProps } from "@hacado/builder";
import { ShortcutsToolbar } from "@hacado/page-builder-base";
import { CarouselProps } from "./schema";
import { carouselShortcuts } from "./shortcuts";

export const CarouselToolbar = (props: ConfigurationProps<CarouselProps>) => (
  <ShortcutsToolbar
    shortcuts={carouselShortcuts}
    data={props.data}
    setData={props.setData}
  />
);
