import {
  useBlockEditor,
  useCurrentBlock,
  useDispatchAction,
} from "@hacado/builder";
import { useCallback } from "react";
import { SpacerProps } from "./schema";
import { Spacer } from "./spacer";

export const SpacerEditor = () => {
  const currentBlock = useCurrentBlock<SpacerProps>();

  const dispatchAction = useDispatchAction();
  const onDimensionsChange = useCallback(
    (_: number, height: number) => {
      dispatchAction({
        type: "set-block-data",
        value: {
          blockId: currentBlock.id,
          data: {
            ...currentBlock.data,
            props: {
              ...currentBlock.data?.props,
              height,
            },
          },
        },
      });
    },
    [dispatchAction, currentBlock],
  );

  const overlayProps = useBlockEditor(currentBlock.id, onDimensionsChange);

  return <Spacer {...currentBlock.data} {...overlayProps} />;
};
