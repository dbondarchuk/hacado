import { Columns2, Rows2 } from "lucide-react";
import { createGridLineStyle } from "./grid-line";

export const gridColumnStartStyle = createGridLineStyle({
  name: "gridColumnStart",
  label: "builder.pageBuilder.styles.properties.gridColumnStart",
  description: "CSS grid-column-start",
  cssProperty: "grid-column-start",
  icon: Columns2,
});

export const gridColumnEndStyle = createGridLineStyle({
  name: "gridColumnEnd",
  label: "builder.pageBuilder.styles.properties.gridColumnEnd",
  description: "CSS grid-column-end",
  cssProperty: "grid-column-end",
  icon: Columns2,
});

export const gridRowStartStyle = createGridLineStyle({
  name: "gridRowStart",
  label: "builder.pageBuilder.styles.properties.gridRowStart",
  description: "CSS grid-row-start",
  cssProperty: "grid-row-start",
  icon: Rows2,
});

export const gridRowEndStyle = createGridLineStyle({
  name: "gridRowEnd",
  label: "builder.pageBuilder.styles.properties.gridRowEnd",
  description: "CSS grid-row-end",
  cssProperty: "grid-row-end",
  icon: Rows2,
});
