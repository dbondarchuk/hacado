import {
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import {
  BackgroundVideoLayer,
  BlockStyle,
  useClassName,
} from "@hacado/page-builder-base";
import { ContainerProps, styles } from "./schema";

export const ContainerEditor = ({ style, props }: ContainerProps) => {
  const currentBlock = useCurrentBlock<ContainerProps>();
  const overlayProps = useBlockEditor(currentBlock.id);

  const className = useClassName();
  const base = currentBlock.base;
  const blockStyle = currentBlock.data?.style;
  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={blockStyle}
      />
      <div className={className} id={base?.id} {...overlayProps}>
        <BackgroundVideoLayer style={blockStyle} />
        <EditorChildren blockId={currentBlock.id} property="props" />
      </div>
    </>
  );
};
