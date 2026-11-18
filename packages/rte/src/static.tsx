/**
 * Server/read entry for the static Plate renderer.
 * Import this instead of `@hacado/rte`: the package root also exports the
 * interactive editor, and a dev full-page load will compile that client graph.
 */
export { PlateStaticFastRenderer as PlateStaticEditor } from "./components/editor/plate-static-fast-renderer";
export type { PlateStaticFastRendererProps as PlateStaticEditorProps } from "./components/editor/plate-static-fast-renderer";
