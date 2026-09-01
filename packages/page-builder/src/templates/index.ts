import { heroEditorTemplates } from "./heroes";
import { marketingEditorTemplates } from "./marketing";

export const pageBuilderEditorTemplates = {
  ...marketingEditorTemplates,
  ...heroEditorTemplates,
};

export { heroEditorTemplates } from "./heroes";
export { marketingEditorTemplates } from "./marketing";
