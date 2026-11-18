/**
 * Server-safe AI capability map for page-builder blocks.
 * Keep this free of React / "use client" so Builder AI API routes can load it.
 * Mirror the `aiCapabilities` assignments in `./index.tsx`.
 */
import type { EditorBlockAICapability } from "@hacado/builder/types";
import {
  IMAGE_AI_CAPABILITIES,
  LAYOUT_AI_CAPABILITIES,
  TEXT_AI_CAPABILITIES,
} from "./ai-capabilities";

export const PAGE_BLOCK_AI_CATALOG_META: Record<
  string,
  { aiCapabilities: EditorBlockAICapability[] }
> = {
  Image: { aiCapabilities: IMAGE_AI_CAPABILITIES },
  Heading: { aiCapabilities: TEXT_AI_CAPABILITIES },
  Text: { aiCapabilities: TEXT_AI_CAPABILITIES },
  PageLayout: { aiCapabilities: LAYOUT_AI_CAPABILITIES },
  Container: { aiCapabilities: LAYOUT_AI_CAPABILITIES },
  GridContainer: { aiCapabilities: LAYOUT_AI_CAPABILITIES },
  FluidLayout: { aiCapabilities: LAYOUT_AI_CAPABILITIES },
  PageHero: { aiCapabilities: LAYOUT_AI_CAPABILITIES },
  ConditionalContainer: { aiCapabilities: LAYOUT_AI_CAPABILITIES },
  ForeachContainer: { aiCapabilities: LAYOUT_AI_CAPABILITIES },
  Carousel: { aiCapabilities: LAYOUT_AI_CAPABILITIES },
  InlineText: { aiCapabilities: TEXT_AI_CAPABILITIES },
  CatalogValue: { aiCapabilities: TEXT_AI_CAPABILITIES },
  TypewriterText: { aiCapabilities: TEXT_AI_CAPABILITIES },
  PhraseCycle: { aiCapabilities: TEXT_AI_CAPABILITIES },
  Accordion: { aiCapabilities: LAYOUT_AI_CAPABILITIES },
  AccordionItem: { aiCapabilities: LAYOUT_AI_CAPABILITIES },
  InlineContainer: { aiCapabilities: LAYOUT_AI_CAPABILITIES },
  MarketingScrollingLogos: { aiCapabilities: LAYOUT_AI_CAPABILITIES },
  MarketingFeaturesShowcase: { aiCapabilities: LAYOUT_AI_CAPABILITIES },
  Table: { aiCapabilities: LAYOUT_AI_CAPABILITIES },
  MarketingBrowserCarousel: { aiCapabilities: LAYOUT_AI_CAPABILITIES },
};
