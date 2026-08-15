import { gapStyle } from "./gap";
import { marginStyle } from "./margin";
import { paddingStyle } from "./padding";

export * from "./gap";
export * from "./margin";
export * from "./padding";

export const spacingStyles = [marginStyle, paddingStyle, gapStyle] as const;
