import { useBlockEditor, useCurrentBlock } from "@hacado/builder";
import { Ref } from "react";
import { YouTubeVideoReader } from "./reader";
import { YouTubeVideoProps } from "./schema";

export const YouTubeVideoEditor: React.FC<YouTubeVideoProps> = (props) => {
  const currentBlock = useCurrentBlock<YouTubeVideoProps>();
  const overlayProps = useBlockEditor(currentBlock.id);

  return (
    <YouTubeVideoReader
      {...props}
      block={currentBlock}
      ref={overlayProps.ref as Ref<HTMLDivElement>}
      onClick={overlayProps.onClick}
    />
  );
};
