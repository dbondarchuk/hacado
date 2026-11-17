/**
 * Content language for AI replies and generated copy.
 * Page/document language overrides brand language when set.
 */
export function resolveContentLanguage(input: {
  documentLanguage?: string | null;
  brandLanguage?: string | null;
}): string {
  const document = input.documentLanguage?.trim();
  if (document) return document;

  const brand = input.brandLanguage?.trim();
  if (brand) return brand;

  return "en";
}

export function contentLanguageInstruction(language: string): string {
  return [
    `Content language: ${language}.`,
    `Write assistant replies and generated content in ${language}.`,
    "Do not switch languages unless the user explicitly asks.",
  ].join(" ");
}
