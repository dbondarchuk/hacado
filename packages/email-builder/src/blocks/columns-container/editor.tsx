import {
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import { BaseColumnsContainer } from "./base";
import { ColumnsContainerProps } from "./schema";

export const ColumnsContainerEditor = ({
  style,
  props,
}: ColumnsContainerProps) => {
  const currentBlock = useCurrentBlock<ColumnsContainerProps>();
  const overlayProps = useBlockEditor(currentBlock.id);

  const { columns, ...restProps } = currentBlock.data?.props ?? {};

  return (
    <BaseColumnsContainer
      {...overlayProps}
      props={restProps}
      style={currentBlock.data?.style}
      columns={[
        <EditorChildren blockId={currentBlock.id} property="props.columns.0" />,
        <EditorChildren blockId={currentBlock.id} property="props.columns.1" />,
        <EditorChildren blockId={currentBlock.id} property="props.columns.2" />,
      ]}
    />
  );
};
