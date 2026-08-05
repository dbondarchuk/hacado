import { ReaderBlock, TReaderBlock } from "@hacado/builder";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn } from "@hacado/ui";
import { Fragment } from "react";
import { MarketingFeaturesShowcaseClient } from "./marketing-features-showcase.client";
import { MarketingFeaturesShowcaseReaderProps } from "./schema";
import { styles } from "./styles";

export const MarketingFeaturesShowcaseReader = (
  readerProps: MarketingFeaturesShowcaseReaderProps,
) => {
  const { block, ...rest } = readerProps;
  const className = generateClassName();
  const base = block.base;

  const featureBlocks = readerProps.props?.features?.children ?? [];

  const features = featureBlocks.map((fb: TReaderBlock) => {
    const p = fb.data?.props;
    const cardIconChildren = p?.cardIcon?.children ?? [];
    const titleChildren = p?.title?.children ?? [];
    const descriptionChildren = p?.description?.children ?? [];
    const detailHeadlineChildren = p?.detailHeadline?.children ?? [];
    const detailBulletsChildren = p?.detailBullets?.children ?? [];

    const cardIconBlock = cardIconChildren[0];

    return {
      id: fb.id,
      cardIcon: cardIconBlock ? (
        <ReaderBlock {...rest} block={cardIconBlock} />
      ) : null,
      title: (
        <>
          {titleChildren.map((c: TReaderBlock) => (
            <ReaderBlock key={c.id} {...rest} block={c} />
          ))}
        </>
      ),
      description: (
        <>
          {descriptionChildren.map((c: TReaderBlock) => (
            <ReaderBlock key={c.id} {...rest} block={c} />
          ))}
        </>
      ),
      expandedTitleRow: (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            {cardIconBlock ? (
              <ReaderBlock {...rest} block={cardIconBlock} />
            ) : null}
          </div>
          <div className="flex min-w-0 flex-col items-start gap-1">
            {titleChildren.map((c: TReaderBlock) => (
              <ReaderBlock key={c.id} {...rest} block={c} />
            ))}
          </div>
        </div>
      ),
      expandedDetails: (
        <>
          {detailHeadlineChildren.map((c: TReaderBlock) => (
            <div key={c.id} className="text-lg font-medium text-foreground">
              <ReaderBlock {...rest} block={c} />
            </div>
          ))}
          {detailBulletsChildren.map((c: TReaderBlock) => (
            <ReaderBlock key={c.id} {...rest} block={c} />
          ))}
        </>
      ),
    };
  });

  return (
    <Fragment>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={readerProps.style}
      />
      <MarketingFeaturesShowcaseClient
        baseId={base?.id}
        baseClassName={cn(className, base?.className)}
        features={features}
      />
    </Fragment>
  );
};
