/** Shared page-builder names and helpers. */

export const MAIN_HEADER_NAME = "Main Header";
export const HERO_HEADER_NAME = "Hero Header";
export const MAIN_FOOTER_NAME = "Main Footer";

export function keywords(...parts: string[]) {
  return ["Hacado", "booking", "appointments", ...parts]
    .filter(Boolean)
    .join(", ");
}
