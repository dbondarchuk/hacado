import { EditorChildren } from "@hacado/builder/blocks";
import { useCurrentBlock } from "@hacado/builder/editor";
import { useBlockEditor } from "@hacado/builder/overlay";
import { BlockFilterRule } from "@hacado/builder/types";
import {
  BackgroundVideoLayer,
  BlockStyle,
  useClassName,
  useResizeBlockStyles,
} from "@hacado/page-builder-base/helpers";
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
