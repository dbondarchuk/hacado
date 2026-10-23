import { generateId, type TEditorBlock } from "@hacado/builder";
import { LinkPropsDefaults } from "../../blocks/link/schema";
import { sectionShell } from "../section-helpers";
import { headingFromText, paragraphFromText } from "./text";

export type LegalDocumentSection = {
  title: string;
  paragraphs: string[];
};

export function legalDocumentBlocks(input: {
  title: string;
  updated: string;
  intro: string;
  sections: LegalDocumentSection[];
}): TEditorBlock[] {
  return [
    sectionShell([
      headingFromText(input.title, { level: "h1", textAlign: "left" }),
      paragraphFromText(input.updated, { textAlign: "left" }),
      paragraphFromText(input.intro, { textAlign: "left" }),
      ...input.sections.flatMap((section) => [
        headingFromText(section.title, { level: "h2", textAlign: "left" }),
        ...section.paragraphs.map((paragraph) =>
          paragraphFromText(paragraph, { textAlign: "left" }),
        ),
      ]),
    ]),
  ];
}

export function legalFooterLink(url: string, text: string): TEditorBlock {
  const linkDefaults = LinkPropsDefaults();
  return {
    type: "Link",
    id: generateId(),
    data: {
      ...linkDefaults,
      props: {
        url,
        target: "_self",
        children: [
          {
            type: "InlineText",
            id: generateId(),
            data: {
              props: { text },
            },
          },
        ],
      },
      style: {
        ...linkDefaults.style,
        color: [{ value: "var(--value-primary-color)" }],
        fontSize: [{ value: { value: 1, unit: "rem" } }],
        textDecoration: [{ value: "underline" }],
        display: [{ value: "inline" }],
      },
    },
  };
}
