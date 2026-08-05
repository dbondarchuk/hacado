import { ReaderDocumentBlocksDictionary } from "@hacado/builder";
import { BlogReaders } from "../apps/blog/blocks/readers";
import { BLOG_APP_NAME } from "../apps/blog/const";
import { FormsReaders } from "../apps/forms/blocks/readers";
import { FORMS_APP_NAME } from "../apps/forms/const";
import { GiftCardStudioReaders } from "../apps/gift-card-studio/blocks/readers";
import { GIFT_CARD_STUDIO_APP_NAME } from "../apps/gift-card-studio/const";
import { WaitlistReaders } from "../apps/waitlist/blocks/readers";
import { WAITLIST_APP_NAME } from "../apps/waitlist/const";
import { MyCabinetReaders } from "../apps/my-cabinet/blocks/readers";
import { MY_CABINET_APP_NAME } from "../apps/my-cabinet/const";

export const AppsBlocksReaders: Record<
  string,
  ReaderDocumentBlocksDictionary<any>
> = {
  [BLOG_APP_NAME]: BlogReaders,
  [FORMS_APP_NAME]: FormsReaders,
  [GIFT_CARD_STUDIO_APP_NAME]: GiftCardStudioReaders,
  [WAITLIST_APP_NAME]: WaitlistReaders,
  [MY_CABINET_APP_NAME]: MyCabinetReaders,
};
