import {
  BlockFilterRule,
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import {
  BlockStyle,
  useClassName,
  useResizeBlockStyles,
} from "@hacado/page-builder-base";
import { InlineContainerProps, styles } from "./schema";

const allowOnly: BlockFilterRule = {
  capabilities: ["inline"],
};

export const InlineContainerEditor = ({
  style,
  props,
}: InlineContainerProps) => {
  const currentBlock = useCurrentBlock<InlineContainerProps>();
  const onResize = useResizeBlockStyles();
  const overlayProps = useBlockEditor(currentBlock.id, onResize);

  const className = useClassName();
  const base = currentBlock.base;

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={currentBlock.data?.style}
      />
      <span className={className} id={base?.id} {...overlayProps}>
        <EditorChildren
          blockId={currentBlock.id}
          property="props"
          allow={allowOnly}
        />
      </span>
    </>
  );
};
