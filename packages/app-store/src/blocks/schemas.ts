import { BaseZodDictionary } from "@hacado/builder/types";
import {
  BlogBlocksAllowedInFooter,
  BlogBlocksSchema,
} from "../apps/blog/blocks/block-schemas";
import { BLOG_APP_NAME } from "../apps/blog/const";
import {
  FormsBlocksAllowedInFooter,
  FormsBlocksSchema,
} from "../apps/forms/blocks/block-schemas";
import { FORMS_APP_NAME } from "../apps/forms/const";
import {
  GiftCardStudioBlocksAllowedInFooter,
  GiftCardStudioBlocksSchema,
} from "../apps/gift-card-studio/blocks/block-schemas";
import { GIFT_CARD_STUDIO_APP_NAME } from "../apps/gift-card-studio/const";
import {
  MyCabinetBlocksAllowedInFooter,
  MyCabinetBlocksSchema,
} from "../apps/my-cabinet/blocks/block-schemas";
import { MY_CABINET_APP_NAME } from "../apps/my-cabinet/const";
import {
  WaitlistBlocksAllowedInFooter,
  WaitlistBlocksSchema,
} from "../apps/waitlist/blocks/block-schemas";
import { WAITLIST_APP_NAME } from "../apps/waitlist/const";

type AppBlockSchemas = {
  schemas: Record<string, BaseZodDictionary[keyof BaseZodDictionary]>;
  allowedInFooter: Record<string, boolean>;
};

export const AppsBlocksSchemas: Record<string, AppBlockSchemas> = {
  [BLOG_APP_NAME]: {
    schemas: BlogBlocksSchema,
    allowedInFooter: BlogBlocksAllowedInFooter,
  },
  [FORMS_APP_NAME]: {
    schemas: FormsBlocksSchema,
    allowedInFooter: FormsBlocksAllowedInFooter,
  },
  [GIFT_CARD_STUDIO_APP_NAME]: {
    schemas: GiftCardStudioBlocksSchema,
    allowedInFooter: GiftCardStudioBlocksAllowedInFooter,
  },
  [WAITLIST_APP_NAME]: {
    schemas: WaitlistBlocksSchema,
    allowedInFooter: WaitlistBlocksAllowedInFooter,
  },
  [MY_CABINET_APP_NAME]: {
    schemas: MyCabinetBlocksSchema,
    allowedInFooter: MyCabinetBlocksAllowedInFooter,
  },
};
