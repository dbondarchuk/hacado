import { generateClassName } from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { GiftCardPurchaseBlockReader } from "./reader-component";
import { GiftCardPurchaseBlockReaderProps } from "./schema";

export const GiftCardPurchaseBlockReaderWrapper = (
  props: GiftCardPurchaseBlockReaderProps & {
    isEditor?: boolean;
  },
) => {
  const metadata = props.block?.metadata as { giftCardStudioAppId?: string };
  const appId = metadata?.giftCardStudioAppId;
  const className = generateClassName();
  const blockProps = props.props;

  return (
    <GiftCardPurchaseBlockReader
      appId={appId}
      className={cn(className, props.block?.base?.className)}
      id={props.block?.base?.id}
      hideTitle={blockProps?.hideTitle ?? false}
      hideSteps={blockProps?.hideSteps ?? false}
    />
  );
};
