import { memo } from "react";
import { ReaderBlock } from "../reader/block";
import {
  useBlockChildrenBlockIds,
  useDocument,
  useDocumentBlock,
  useEditorArgs,
  useReaderBlocks,
} from "./context";

export const EditorReaderBlock = memo(({ blockId }: { blockId: string }) => {
  const block = useDocumentBlock(blockId);
  const blocks = useReaderBlocks();
  const args = useEditorArgs();
  const document = useDocument();
  if (!block) return null;
  return (
    <ReaderBlock
      document={document}
      block={block}
      blocks={blocks}
      args={args}
      isEditor
    />
    // <EditorBlock
    //   blockId={blockId}
    //   index={0}
    //   parentBlockId={""}
    //   parentProperty={""}
    //   disableClone
    //   disableDelete
    //   disableMove
    //   disableDrag
    //   isOverlay
    // />
  );
});

export const EditorReaderChildrenBlock = memo(
  ({ blockId, property }: { blockId: string; property: string }) => {
    const childrenIds = useBlockChildrenBlockIds(blockId, property);
    return (
      <>
        {childrenIds?.map((childId) => (
          <EditorReaderBlock key={childId} blockId={childId} />
        ))}
      </>
    );
  },
);
