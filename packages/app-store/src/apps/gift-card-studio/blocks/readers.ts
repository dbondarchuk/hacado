import { ReaderDocumentBlocksDictionary } from "@hacado/builder";
import { GiftCardPurchaseBlockReaderWrapper } from "./gift-card-purchase";
import type { GiftCardStudioBlocksSchema } from "./schema";

export const GiftCardStudioReaders: ReaderDocumentBlocksDictionary<
  typeof GiftCardStudioBlocksSchema
> = {
  GiftCardPurchase: {
    Reader: GiftCardPurchaseBlockReaderWrapper,
  },
};
