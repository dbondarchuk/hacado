import { TemplateDefinition } from "@hacado/builder/types";
import { BlogTemplates } from "../apps/blog/blocks/templates";
import { BLOG_APP_NAME } from "../apps/blog/const";

export const AppsBlocksTemplates: Record<
  string,
  (
    appName: string,
    appId: string,
  ) => {
    [name: string]: {
      configuration: TemplateDefinition;
      allowedInFooter: boolean;
    };
  }
> = {
  [BLOG_APP_NAME]: (appName: string, appId: string) =>
    Object.fromEntries(
      Object.entries(BlogTemplates(appName, appId)).map(([name, template]) => [
        name,
        {
          configuration: template,
          allowedInFooter: false,
        },
      ]),
    ),
};
