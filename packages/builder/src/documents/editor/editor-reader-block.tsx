import { memo, useMemo } from "react";
import { getReaderBlockRenderer } from "../reader/block";
import {
  useBlockChildrenBlockIds,
  useDocumentBlock,
  useEditorArgs,
  useReaderBlocks,
} from "./context";

export const EditorReaderBlock = memo(({ blockId }: { blockId: string }) => {
  const block = useDocumentBlock(blockId);
  const blocks = useReaderBlocks();
  const args = useEditorArgs();

  const ReaderBlock = useMemo(() => {
    return getReaderBlockRenderer(blocks);
  }, [blocks]);

  if (!block) return null;

  return (
    <ReaderBlock block={block} args={args} isEditor ReaderBlock={ReaderBlock} />
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
