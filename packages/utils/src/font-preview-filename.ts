/** FNV-1a 32-bit */
function fnv1a32(str: string): string {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }

  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * Deterministic PNG filename for a Google Font family (admin install previews).
 * Hash suffix avoids rare slug collisions between different family names.
 */
export function getWebfontPreviewFilename(family: string): string {
  const slug = family
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  const id = fnv1a32(family);
  return `${slug || "font"}-${id}.png`;
}
