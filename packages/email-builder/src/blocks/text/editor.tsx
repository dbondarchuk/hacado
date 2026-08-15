import {
  useBlockEditor,
  useCurrentBlock,
  useCurrentBlockId,
  useDispatchAction,
  useIsSelectedBlock,
  usePortalContext,
} from "@hacado/builder";
import { PlateEditor, PlateStaticEditor } from "@hacado/rte";
import { TextProps } from "./schema";
import { getStyles } from "./styles";

export const TextEditor = ({ props, style }: TextProps) => {
  const styles = getStyles({ style });
  const currentBlock = useCurrentBlock<TextProps>();
  const dispatchAction = useDispatchAction();

  const currentBlockId = useCurrentBlockId();
  const overlayProps = useBlockEditor(currentBlockId);
  const { document } = usePortalContext();
  const isSelected = useIsSelectedBlock(currentBlockId);

  const onChange = (value: any) => {
    dispatchAction({
      type: "set-block-data",
      value: {
        blockId: currentBlock.id,
        data: {
          ...currentBlock.data,
          props: {
            ...currentBlock.data?.props,
            value,
          },
        },
      },
    });
  };

  return (
    <div {...overlayProps} style={styles}>
      {isSelected ? (
        <PlateEditor
          value={currentBlock?.data?.props?.value}
          onChange={onChange}
          document={document}
          className="w-full bg-transparent border-0 focus-visible:ring-0 rounded-none h-auto p-0 sm:px-0 border-none leading-normal md:leading-normal"
          usesAbsoluteUrl
        />
      ) : (
        <PlateStaticEditor value={props?.value} />
      )}
    </div>
  );
};
