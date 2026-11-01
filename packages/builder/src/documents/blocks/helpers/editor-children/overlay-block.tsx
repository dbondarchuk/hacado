import { AnimatePresence, motion } from "framer-motion";
import { memo, useMemo } from "react";
import { EditorBlock } from "../../../editor/block";
import {
  useActiveDragBlock,
  useIsActiveOverDroppable,
} from "../../../editor/context";

const OverlayBlockContent = memo(
  ({
    blockId,
    property,
    index,
  }: {
    blockId: string;
    property: string;
    index: number;
  }) => {
    const activeDragBlock = useActiveDragBlock();

    const dragBlockId = activeDragBlock?.blockId;
    const RenderedBlock = useMemo(() => {
      if (!dragBlockId) return null;

      return (
        <EditorBlock
          blockId={dragBlockId}
          index={0}
          parentBlockId={""}
          parentProperty={""}
          disableClone
          disableDelete
          disableMove
          disableDrag
          isOverlay
        />
      );
    }, [dragBlockId]);

    // Don't show overlay block if the active drag block is in the same position as the current over block
    if (!activeDragBlock) return null;
    if (
      activeDragBlock.parentBlockId === blockId &&
      activeDragBlock.parentProperty === property &&
      activeDragBlock.index === index
    )
      return null;

    return (
      <AnimatePresence>
        <motion.div
          layoutId="overlay-block"
          // className="contents *:relative *:after:absolute *:after:inset-0 *:after:bg-blue-700/50 *:after:z-[2]"
          className="bg-blue-700/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {RenderedBlock}
        </motion.div>
      </AnimatePresence>
    );
  },
);

export const OverlayBlock = memo(
  ({
    blockId,
    property,
    index,
  }: {
    blockId: string;
    property: string;
    index: number;
  }) => {
    const isActiveOverDroppable = useIsActiveOverDroppable(
      blockId,
      property,
      index,
    );

    // return null;
    return isActiveOverDroppable ? (
      <OverlayBlockContent
        blockId={blockId}
        property={property}
        index={index}
      />
    ) : null;
  },
);
