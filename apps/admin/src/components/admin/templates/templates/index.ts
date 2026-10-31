import { TemplateTemplatesList } from "@hacado/types/templates";
import { enTemplates } from "./en";
import { esTemplates } from "./es";
import { frTemplates } from "./fr";
import { ukTemplates } from "./uk";

const languageTemplates = {
  en: enTemplates,
  fr: frTemplates,
  es: esTemplates,
  uk: ukTemplates,
} as const;

/** Built-in template templates, grouped by id and then language */
export const BuiltInTemplateTemplates: TemplateTemplatesList = Object.entries(
  languageTemplates,
)
  .map(([language, templates]) =>
    Object.entries(templates).map(([id, template]) => ({
      id,
      language,
      template,
    })),
  )
  .flat()
  .reduce((acc, { id, language, template }) => {
    const newList = {
      ...(acc[id] || {}),
      [language]: template,
    };
    return {
      ...acc,
      [id]: newList,
    };
  }, {} as TemplateTemplatesList);
