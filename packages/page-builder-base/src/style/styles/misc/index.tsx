import { contentStyle } from "./content";
import { customCssStyle } from "./customCss";

export * from "./content";
export * from "./customCss";

export const miscStyles = [contentStyle, customCssStyle] as const;
