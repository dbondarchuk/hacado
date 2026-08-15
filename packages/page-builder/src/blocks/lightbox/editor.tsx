import {
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
} from "@hacado/builder";
import { LightboxProvider } from "./context";
import { LightboxProps } from "./schema";

export const LightboxEditor = () => {
  const currentBlock = useCurrentBlock<LightboxProps>();
  const overlayProps = useBlockEditor(currentBlock.id);

  return (
    <LightboxProvider>
      <div className="w-full relative" {...overlayProps}>
        <EditorChildren blockId={currentBlock.id} property="props" />
      </div>
      {/* Do not use Lightbox in editor, as it will interfere with the image editor */}
      {/* <Lightbox {...currentBlock.data?.props} /> */}
    </LightboxProvider>
  );
};
