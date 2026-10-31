import { useCurrentBlock } from "@hacado/builder/editor";
import { useBlockEditor } from "@hacado/builder/overlay";
import { Divider } from "./divider";
import { DividerProps } from "./schema";

export const DividerEditor = ({ props, style }: DividerProps) => {
  const currentBlock = useCurrentBlock<DividerProps>();
  const overlayProps = useBlockEditor(currentBlock.id);

  return <Divider {...overlayProps} style={style} props={props} />;
};
