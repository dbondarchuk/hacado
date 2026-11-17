import type { PageLayoutProps } from "./schema";

export const PageLayoutDefaultProps = {
  fontFamily: "PRIMARY",
  fullWidth: true,
  children: [],
} as const satisfies PageLayoutProps;
