import { BlogTemplatePreviewProvider } from "./apps/blog/blocks/preview-provider";
import { BLOG_APP_NAME } from "./apps/blog/const";
import type { TemplatePreviewProvider } from "./template-previews/types";

export const AppsTemplatePreviewProviders: Record<
  string,
  TemplatePreviewProvider
> = {
  [BLOG_APP_NAME]: BlogTemplatePreviewProvider,
};

export {
  findPreviewProvider,
  flattenPreviewEntries,
  getPreviewDelayMs,
  TEMPLATE_PREVIEW_BASE,
  templatePreviewPath,
} from "./template-previews/types";
export type {
  TemplatePreviewEntry,
  TemplatePreviewProvider,
} from "./template-previews/types";
