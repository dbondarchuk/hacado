import {
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { ContainerProps, styles } from "./schema";

export const ContainerEditor = ({ style, props }: ContainerProps) => {
  const currentBlock = useCurrentBlock<ContainerProps>();
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
