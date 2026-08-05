import {
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
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
