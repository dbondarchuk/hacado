import { EditorChildren } from "@hacado/builder/blocks";
import { useCurrentBlock } from "@hacado/builder/editor";
import { useBlockEditor } from "@hacado/builder/overlay";
import { BaseContainer } from "./base";
import { ContainerProps } from "./schema";

export const ContainerEditor = ({ style, props }: ContainerProps) => {
  const currentBlock = useCurrentBlock<ContainerProps>();
  const overlayProps = useBlockEditor(currentBlock.id);

  return (
    <BaseContainer style={currentBlock.data?.style} {...overlayProps}>
      <EditorChildren blockId={currentBlock.id} property="props" />
    </BaseContainer>
  );
};
