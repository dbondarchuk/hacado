import { features } from "../content/site";
import { comparePages } from "../content/site";
import { allSeoLandingPages } from "../content/seoPages";
import { useCases } from "../content/useCases";
import {
  compareAlternativeRedirectPages,
  compareHubPage,
  comparePage,
} from "./compare";
import { featurePage, featuresHubPage } from "./features";
import { homePage } from "./home";
import { seoLandingPage, seoLandingRedirectPages } from "./seo";
import {
  aboutPage,
  contactPage,
  integrationsPage,
  notFoundPage,
  pricingPage,
  privacyPage,
  revenueToolsRedirect,
  supportPage,
  termsPage,
} from "./site";
import { MAIN_HEADER_NAME } from "./shared";
import { useCasePage, useCasesHubPage } from "./use-cases";

export {
  MAIN_HEADER_NAME,
  HERO_HEADER_NAME,
  MAIN_FOOTER_NAME,
} from "./shared";
export {
  buildHeader,
  buildHeroHeader,
  buildHeaders,
  buildFooter,
} from "./chrome";

export function buildPages() {
  return [
    homePage(),
    featuresHubPage(),
    revenueToolsRedirect(),
    ...features.map(featurePage),
    useCasesHubPage(),
    ...useCases.map(useCasePage),
    compareHubPage(),
    ...comparePages.map(comparePage),
    ...compareAlternativeRedirectPages(),
    ...allSeoLandingPages.map(seoLandingPage),
    ...seoLandingRedirectPages(),
    pricingPage(),
    integrationsPage(),
    aboutPage(),
    supportPage(),
    contactPage(),
    privacyPage(),
    termsPage(),
    notFoundPage(),
  ].map((page) => ({
    ...page,
    headerName: page.headerName ?? MAIN_HEADER_NAME,
  }));
}
