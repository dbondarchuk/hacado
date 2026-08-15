import { pageDefault } from "./page";

export const giftCardsDefaultPage = (
  giftCardStudioAppId: string,
  giftCardStudioLabels: Record<string, string>,
) =>
  pageDefault(
    [
      {
        id: "block-f6507cd3-f0c6-41cd-b92e-4504117c0010",
        type: "GiftCardPurchase",
        data: {
          props: {
            hideTitle: true,
          },
          metadata: {
            giftCardStudioAppId: giftCardStudioAppId,
          },
        },
      },
    ],
    giftCardStudioLabels.title,
  );
