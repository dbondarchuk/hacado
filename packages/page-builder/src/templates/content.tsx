import { generateId, TemplatesConfiguration } from "@hacado/builder";
import type { BaseAllKeys } from "@hacado/i18n";
import {
  HelpCircle,
  ListOrdered,
  SlidersHorizontal,
  Table2,
} from "lucide-react";
import { TablePropsDefaults } from "../blocks/table/schema";
import { sectionTemplatePreviewPath } from "./preview-manifest";
import {
  buildAccordion,
  buildBeforeAfter,
  buildSectionIntro,
  compositeContainer,
  responsiveCardsGrid,
  sectionShell,
  styledStep,
} from "./section-helpers";
import { SALON_IMAGES } from "./template-media";

const category =
  "builder.pageBuilder.blocks.categories.content" satisfies BaseAllKeys;

const prefix = "builder.pageBuilder.sectionDefaults.content";

export const contentEditorTemplates: TemplatesConfiguration = {
  FaqSection: {
    displayName:
      "builder.pageBuilder.templates.content.faqSection" satisfies BaseAllKeys,
    icon: <HelpCircle />,
    category,
    previewImage: sectionTemplatePreviewPath("faq-section.png"),
    getBlock: (t) =>
      compositeContainer([
        buildSectionIntro(t, {
          eyebrow: `${prefix}.faqSection.eyebrow` as BaseAllKeys,
          title: `${prefix}.faqSection.title` as BaseAllKeys,
          body: `${prefix}.faqSection.body` as BaseAllKeys,
        }),
        buildAccordion(t, [
          {
            title: `${prefix}.faqSection.q1` as BaseAllKeys,
            content: `${prefix}.faqSection.a1` as BaseAllKeys,
          },
          {
            title: `${prefix}.faqSection.q2` as BaseAllKeys,
            content: `${prefix}.faqSection.a2` as BaseAllKeys,
          },
          {
            title: `${prefix}.faqSection.q3` as BaseAllKeys,
            content: `${prefix}.faqSection.a3` as BaseAllKeys,
          },
          {
            title: `${prefix}.faqSection.q4` as BaseAllKeys,
            content: `${prefix}.faqSection.a4` as BaseAllKeys,
          },
        ]),
      ]),
  },

  HowItWorksSection: {
    displayName:
      "builder.pageBuilder.templates.content.howItWorksSection" satisfies BaseAllKeys,
    icon: <ListOrdered />,
    category,
    previewImage: sectionTemplatePreviewPath("how-it-works-section.png"),
    allowedBuilderTypes: ["page"],
    getBlock: (t) =>
      sectionShell([
        buildSectionIntro(t, {
          title: `${prefix}.howItWorksSection.title` as BaseAllKeys,
          body: `${prefix}.howItWorksSection.body` as BaseAllKeys,
        }),
        responsiveCardsGrid([
          styledStep(t, {
            number: `${prefix}.howItWorksSection.step1Number` as BaseAllKeys,
            title: `${prefix}.howItWorksSection.step1Title` as BaseAllKeys,
            bullets: `${prefix}.howItWorksSection.step1Bullets` as BaseAllKeys,
          }),
          styledStep(t, {
            number: `${prefix}.howItWorksSection.step2Number` as BaseAllKeys,
            title: `${prefix}.howItWorksSection.step2Title` as BaseAllKeys,
            bullets: `${prefix}.howItWorksSection.step2Bullets` as BaseAllKeys,
          }),
          styledStep(t, {
            number: `${prefix}.howItWorksSection.step3Number` as BaseAllKeys,
            title: `${prefix}.howItWorksSection.step3Title` as BaseAllKeys,
            bullets: `${prefix}.howItWorksSection.step3Bullets` as BaseAllKeys,
          }),
          styledStep(t, {
            number: `${prefix}.howItWorksSection.step4Number` as BaseAllKeys,
            title: `${prefix}.howItWorksSection.step4Title` as BaseAllKeys,
            bullets: `${prefix}.howItWorksSection.step4Bullets` as BaseAllKeys,
          }),
        ]),
      ]),
  },

  ComparisonTableSection: {
    displayName:
      "builder.pageBuilder.templates.content.comparisonTableSection" satisfies BaseAllKeys,
    icon: <Table2 />,
    category,
    previewImage: sectionTemplatePreviewPath("comparison-table-section.png"),
    getBlock: (t) =>
      compositeContainer([
        buildSectionIntro(t, {
          title: `${prefix}.comparisonTableSection.title` as BaseAllKeys,
          body: `${prefix}.comparisonTableSection.body` as BaseAllKeys,
        }),
        {
          type: "Table",
          id: generateId(),
          data: TablePropsDefaults(t),
        },
      ]),
  },

  BeforeAfterSection: {
    displayName:
      "builder.pageBuilder.templates.content.beforeAfterSection" satisfies BaseAllKeys,
    icon: <SlidersHorizontal />,
    category,
    previewImage: sectionTemplatePreviewPath("before-after-section.png"),
    getBlock: (t) =>
      compositeContainer([
        buildSectionIntro(t, {
          title: `${prefix}.beforeAfterSection.title` as BaseAllKeys,
          body: `${prefix}.beforeAfterSection.body` as BaseAllKeys,
        }),
        buildBeforeAfter(
          SALON_IMAGES.styling,
          SALON_IMAGES.interior,
          t(`${prefix}.beforeAfterSection.beforeAlt` as BaseAllKeys),
          t(`${prefix}.beforeAfterSection.afterAlt` as BaseAllKeys),
        ),
      ]),
  },
};
