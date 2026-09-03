import { TemplatesConfiguration } from "@hacado/builder";
import type { BaseAllKeys } from "@hacado/i18n";
import { COLORS } from "@hacado/page-builder-base/style";
import { CreditCard, Flag, Megaphone } from "lucide-react";
import {
  fluidSection,
  fullWidthPlacement,
  imageBackgroundStyle,
} from "./fluid-helpers";
import { sectionTemplatePreviewPath } from "./preview-manifest";
import {
  boxShadowValue,
  buildSectionIntro,
  compositeContainer,
  flexFill,
  flexRow,
  marketingBlock,
  roundedLg,
  sectionShell,
  translateYRem,
  withBlockStyle,
} from "./section-helpers";

const category =
  "builder.pageBuilder.blocks.categories.conversion" satisfies BaseAllKeys;

const prefix = "builder.pageBuilder.sectionDefaults.conversion";

const CTA_BACKGROUND =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1920&q=80";

export const conversionEditorTemplates: TemplatesConfiguration = {
  PricingThreeColumn: {
    displayName:
      "builder.pageBuilder.templates.conversion.pricingThreeColumn" satisfies BaseAllKeys,
    icon: <CreditCard />,
    category,
    previewImage: sectionTemplatePreviewPath("pricing-three-column.png"),
    allowedBuilderTypes: ["page"],
    getBlock: (t) => {
      const plans = [1, 2, 3].map(() => marketingBlock("PlanCard", t));
      const highlighted = withBlockStyle(plans[1], {
        borderColor: [{ value: COLORS.primary.value }],
        borderWidth: [{ value: { value: 2, unit: "px" } }],
        backgroundColor: [{ value: COLORS.card.value }],
        boxShadow: boxShadowValue(16, 40, -12, COLORS.primary.value),
        transform: translateYRem(-0.5),
      });
      plans[1] = highlighted;
      return sectionShell(
        [
          buildSectionIntro(t, {
            title: `${prefix}.pricingThreeColumn.title` as BaseAllKeys,
            body: `${prefix}.pricingThreeColumn.body` as BaseAllKeys,
          }),
          flexRow(
            plans.map((plan, index) =>
              withBlockStyle(plan, {
                ...flexFill(16),
                maxWidth: [{ value: { value: 22, unit: "rem" } }],
                borderRadius: roundedLg(),
                ...(index !== 1
                  ? {
                      backgroundColor: [{ value: COLORS.card.value }],
                      borderStyle: [{ value: "solid" }],
                      borderWidth: [{ value: { value: 1, unit: "px" } }],
                      borderColor: [{ value: COLORS.border.value }],
                    }
                  : {}),
              }),
            ),
            { gapRem: 1.5, align: "stretch" },
          ),
        ],
        {
          backgroundColor: [{ value: COLORS.muted.value }],
        },
      );
    },
  },

  CtaBandSection: {
    displayName:
      "builder.pageBuilder.templates.conversion.ctaBandSection" satisfies BaseAllKeys,
    icon: <Megaphone />,
    category,
    previewImage: sectionTemplatePreviewPath("cta-band-section.png"),
    allowedBuilderTypes: ["page"],
    getBlock: (t) => {
      const cta = withBlockStyle(marketingBlock("CtaBand", t), {
        backgroundColor: [{ value: "transparent" }],
        padding: [
          {
            value: {
              top: { value: 2.5, unit: "rem" },
              bottom: { value: 2.5, unit: "rem" },
              left: { value: 1.5, unit: "rem" },
              right: { value: 1.5, unit: "rem" },
            },
          },
        ],
        alignItems: [{ value: "center" }],
        textAlign: [{ value: "center" }],
      });
      return fluidSection(
        [cta],
        { [cta.id]: fullWidthPlacement(cta.id, 1, 10) },
        imageBackgroundStyle(CTA_BACKGROUND, 55),
      );
    },
  },

  AnnouncementBar: {
    displayName:
      "builder.pageBuilder.templates.conversion.announcementBar" satisfies BaseAllKeys,
    icon: <Flag />,
    category,
    previewImage: sectionTemplatePreviewPath("announcement-bar.png"),
    allowedBuilderTypes: ["page"],
    getBlock: (t) =>
      compositeContainer([marketingBlock("Banner", t)], 0, {
        padding: [
          {
            value: {
              top: { value: 0.5, unit: "rem" },
              bottom: { value: 0.5, unit: "rem" },
              left: { value: 0, unit: "rem" },
              right: { value: 0, unit: "rem" },
            },
          },
        ],
      }),
  },
};
