"use client";

import {
  useCurrentBlockId,
  useDispatchAction,
  useEditorStateStore,
} from "@hacado/builder";
import { useCallback } from "react";
import { BaseStyleDictionary, StyleValue } from "../style";

const getUpdatedSize = (
  currentBlockStyle: StyleValue<BaseStyleDictionary>,
  width: number,
  height: number,
) => {
  const newStyles = currentBlockStyle || {};

  newStyles.width =
    newStyles.width?.filter(
      (w) => !!w.breakpoint?.length || !!w.state?.length,
    ) || [];
  newStyles.height =
    newStyles.height?.filter(
      (h) => !!h.breakpoint?.length || !!h.state?.length,
    ) || [];

  newStyles.width.push({
    value: {
      value: width,
      unit: "px",
    },
  });

  newStyles.height.push({
    value: {
      value: height,
      unit: "px",
    },
  });

  return newStyles;
};

export const useResizeBlockStyles = () => {
  const currentBlockId = useCurrentBlockId();
  const store = useEditorStateStore();
  const dispatchAction = useDispatchAction();

  const callback = useCallback(
    (width: number, height: number) => {
      dispatchAction({
        type: "set-block-data",
        value: {
          blockId: currentBlockId,
          data: {
            style: getUpdatedSize(
              store.getState().indexes[currentBlockId].block.data.style,
              width,
              height,
            ),
          },
        },
      });
    },
    [currentBlockId, dispatchAction],
  );

  return callback;
};
