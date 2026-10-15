import {
  BaseZodDictionary,
  EditorDocumentBlocksDictionary,
  TemplateDefinition,
} from "@hacado/builder";
import { BlogBlocks } from "../apps/blog/blocks/schema";
import { BlogTemplates } from "../apps/blog/blocks/templates";
import { BLOG_APP_NAME } from "../apps/blog/const";
import { FormsBlocks } from "../apps/forms/blocks/schema";
import { FORMS_APP_NAME } from "../apps/forms/const";
import { GiftCardStudioBlocks } from "../apps/gift-card-studio/blocks/schema";
import { GIFT_CARD_STUDIO_APP_NAME } from "../apps/gift-card-studio/const";
import { MyCabinetBlocks } from "../apps/my-cabinet/blocks/schema";
import { MY_CABINET_APP_NAME } from "../apps/my-cabinet/const";
import { WaitlistBlocks } from "../apps/waitlist/blocks/schema";
import { WAITLIST_APP_NAME } from "../apps/waitlist/const";

export const AppsBlocksEditors: Record<
  string,
  {
    [name: string]: {
      schema: BaseZodDictionary[keyof BaseZodDictionary];
      editor: EditorDocumentBlocksDictionary[keyof BaseZodDictionary];
      defaultMetadata?: (appName: string, appId: string) => Record<string, any>;
      allowedInFooter: boolean;
    };
  }
> = {
  [BLOG_APP_NAME]: BlogBlocks,
  [FORMS_APP_NAME]: FormsBlocks,
  [GIFT_CARD_STUDIO_APP_NAME]: GiftCardStudioBlocks,
  [WAITLIST_APP_NAME]: WaitlistBlocks,
  [MY_CABINET_APP_NAME]: MyCabinetBlocks,
};

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
