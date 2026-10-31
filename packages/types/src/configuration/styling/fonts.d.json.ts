/**
 * Ambient type for fonts.json so TypeScript does not infer ~1900 font
 * literals (quadratic checkExpression cost in tsserver).
 * Requires compilerOptions.allowArbitraryExtensions.
 */
export type FontItem = {
  family: string;
  variants: string[];
  subsets: string[];
  category: string;
  files: Record<string, string>;
  version?: string;
  lastModified?: string;
  kind?: string;
  menu?: string;
};

export type FontCatalog = {
  kind: string;
  items: FontItem[];
};

declare const fonts: FontCatalog;
export default fonts;
