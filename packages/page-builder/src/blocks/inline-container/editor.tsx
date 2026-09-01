import {
  BlockFilterRule,
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import {
  BackgroundVideoLayer,
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
  const blockStyle = currentBlock.data?.style;

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={blockStyle}
      />
      <span className={className} id={base?.id} {...overlayProps}>
        <BackgroundVideoLayer style={blockStyle} />
        <EditorChildren
          blockId={currentBlock.id}
          property="props"
          allow={allowOnly}
        />
      </span>
    </>
  );
};
