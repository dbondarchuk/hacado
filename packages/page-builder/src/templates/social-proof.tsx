import { TemplatesConfiguration } from "@hacado/builder";
import type { BaseAllKeys } from "@hacado/i18n";
import {
  BarChart3,
  Building2,
  Grid3x3,
  MessageSquareQuote,
} from "lucide-react";
import { sectionTemplatePreviewPath } from "./preview-manifest";
import {
  boxShadowValue,
  buildScrollingLogos,
  buildSectionIntro,
  COLORS,
  logoImageCard,
  marketingBlock,
  responsiveCardsGrid,
  roundedLg,
  sectionShell,
  styledStatCell,
  withBlockStyle,
} from "./section-helpers";
import { TEMPLATE_LOGOS } from "./template-media";

const category =
  "builder.pageBuilder.blocks.categories.socialProof" satisfies BaseAllKeys;

const prefix = "builder.pageBuilder.sectionDefaults.socialProof";

const MARQUEE_LOGOS = TEMPLATE_LOGOS.map((logo) => ({ ...logo }));

export const socialProofEditorTemplates: TemplatesConfiguration = {
  LogoMarqueeSection: {
    displayName:
      "builder.pageBuilder.templates.socialProof.logoMarquee" satisfies BaseAllKeys,
    icon: <Building2 />,
    category,
    previewImage: sectionTemplatePreviewPath("logo-marquee.png"),
    getBlock: (t) =>
      sectionShell([
        buildSectionIntro(t, {
          title: `${prefix}.logoMarquee.title` as BaseAllKeys,
          body: `${prefix}.logoMarquee.body` as BaseAllKeys,
        }),
        buildScrollingLogos(t, MARQUEE_LOGOS),
      ]),
  },

  StatsRowSection: {
    displayName:
      "builder.pageBuilder.templates.socialProof.statsRow" satisfies BaseAllKeys,
    icon: <BarChart3 />,
    category,
    previewImage: sectionTemplatePreviewPath("stats-row.png"),
    getBlock: (t) =>
      sectionShell(
        [
          buildSectionIntro(t, {
            title: `${prefix}.statsRow.title` as BaseAllKeys,
            body: `${prefix}.statsRow.body` as BaseAllKeys,
          }),
          responsiveCardsGrid(
            ([1, 2, 3, 4] as const).map((index) =>
              styledStatCell(
                t,
                {
                  value: `${prefix}.statsRow.stat${index}Value` as BaseAllKeys,
                  label: `${prefix}.statsRow.stat${index}Label` as BaseAllKeys,
                  supporting:
                    `${prefix}.statsRow.stat${index}Supporting` as BaseAllKeys,
                },
                { highlight: index === 2 },
              ),
            ),
          ),
        ],
        {
          backgroundColor: [{ value: COLORS.muted.value }],
        },
      ),
  },

  TestimonialsGrid: {
    displayName:
      "builder.pageBuilder.templates.socialProof.testimonialsGrid" satisfies BaseAllKeys,
    icon: <MessageSquareQuote />,
    category,
    previewImage: sectionTemplatePreviewPath("testimonials-grid.png"),
    getBlock: (t) =>
      sectionShell([
        buildSectionIntro(t, {
          title: `${prefix}.testimonialsGrid.title` as BaseAllKeys,
          body: `${prefix}.testimonialsGrid.body` as BaseAllKeys,
        }),
        responsiveCardsGrid(
          [1, 2, 3, 4].map(() =>
            withBlockStyle(marketingBlock("TestimonialCard", t), {
              backgroundColor: [{ value: COLORS.card.value }],
              boxShadow: boxShadowValue(8, 30, -8, COLORS.foreground.value),
              borderRadius: roundedLg(),
              height: [{ value: { value: 100, unit: "%" } }],
            }),
          ),
        ),
      ]),
  },

  LogoCloudGrid: {
    displayName:
      "builder.pageBuilder.templates.socialProof.logoCloudGrid" satisfies BaseAllKeys,
    icon: <Grid3x3 />,
    category,
    previewImage: sectionTemplatePreviewPath("logo-cloud-grid.png"),
    getBlock: (t) =>
      sectionShell([
        buildSectionIntro(t, {
          title: `${prefix}.logoCloudGrid.title` as BaseAllKeys,
          body: `${prefix}.logoCloudGrid.body` as BaseAllKeys,
        }),
        responsiveCardsGrid(
          TEMPLATE_LOGOS.slice(0, 8).map((logo) =>
            logoImageCard(t, logo.src, logo.name),
          ),
        ),
      ]),
  },
};
