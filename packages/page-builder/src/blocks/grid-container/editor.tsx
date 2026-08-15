import {
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { GridContainerProps, styles } from "./schema";

export const GridContainerEditor = ({ style, props }: GridContainerProps) => {
  const currentBlock = useCurrentBlock<GridContainerProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const className = useClassName();
  const base = currentBlock.base;

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={currentBlock.data?.style}
      />
      <div className={className} id={base?.id} {...overlayProps}>
        <EditorChildren blockId={currentBlock.id} property="props" />
      </div>
    </>
  );
};
