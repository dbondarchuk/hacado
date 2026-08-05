"use client";

import { resolve } from "@hacado/utils";
import { useCallback } from "react";
import {
  useBlock,
  useDispatchAction,
  useSelectedSlot,
} from "../../documents/editor/context";
import { setPropsAtPath } from "../../documents/helpers/set-props-at-path";

export function useSelectedSlotStyleHandlers() {
  const selectedSlot = useSelectedSlot();
  const parentBlock = useBlock(selectedSlot?.blockId ?? "");
  const dispatchAction = useDispatchAction();

  const styles: Record<string, unknown> = (() => {
    if (!selectedSlot || !parentBlock) return {};
    const path = selectedSlot.styleProperty.startsWith("data.")
      ? selectedSlot.styleProperty
      : `data.${selectedSlot.styleProperty}`;
    return (resolve(parentBlock, path, true) as Record<string, unknown>) ?? {};
  })();

  const setStyles = useCallback(
    (next: Record<string, unknown>) => {
      if (!selectedSlot || !parentBlock?.data) return;
      const stylePath = selectedSlot.styleProperty.replace(/^props\./, "");
      const props = setPropsAtPath(
        parentBlock.data.props as Record<string, unknown>,
        stylePath,
        next,
      );
      dispatchAction({
        type: "set-block-data",
        value: {
          blockId: selectedSlot.blockId,
          data: {
            ...parentBlock.data,
            props,
          },
        },
      });
    },
    [dispatchAction, parentBlock?.data, selectedSlot],
  );

  return { selectedSlot, styles, setStyles };
}
