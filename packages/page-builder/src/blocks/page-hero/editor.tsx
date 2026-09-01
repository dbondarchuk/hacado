"use client";

import {
  BlockFilterRule,
  EditorBlock,
  useBlockChildrenBlockIds,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import {
  BackgroundVideoLayer,
  BlockStyle,
  useClassName,
} from "@hacado/page-builder-base";
import { cn } from "@hacado/ui";
import { PageHeroProps } from "./schema";
import { styles } from "./styles";

const disable = {
  disableMove: true,
  disableDelete: true,
  disableClone: true,
  disableDrag: true,
};

const allowOnly: BlockFilterRule = {
  capabilities: ["heading"],
};

export const PageHeroEditor = ({ props, style }: PageHeroProps) => {
  const currentBlock = useCurrentBlock<PageHeroProps>();
  const overlayProps = useBlockEditor(currentBlock.id);

  const titleId = useBlockChildrenBlockIds(currentBlock.id, "props.title")?.[0];
  const subtitleId = useBlockChildrenBlockIds(
    currentBlock.id,
    "props.subtitle",
  )?.[0];
  const buttonsId = useBlockChildrenBlockIds(
    currentBlock.id,
    "props.buttons",
  )?.[0];
  const className = useClassName();
  const base = currentBlock?.base;

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <section
        className={cn(className, base?.className)}
        id={base?.id}
        {...overlayProps}
      >
        <BackgroundVideoLayer style={style} />
        {!!titleId && (
          <EditorBlock
            blockId={titleId}
            {...disable}
            index={0}
            parentBlockId={currentBlock.id}
            parentProperty="title"
            allow={allowOnly}
          />
        )}
        {!!subtitleId && (
          <EditorBlock
            blockId={subtitleId}
            {...disable}
            index={0}
            parentBlockId={currentBlock.id}
            parentProperty="subtitle"
            allow={allowOnly}
          />
        )}
        {!!buttonsId && (
          <EditorBlock
            blockId={buttonsId}
            {...disable}
            index={0}
            parentBlockId={currentBlock.id}
            parentProperty="buttons"
          />
        )}
      </section>
    </>
  );
};
