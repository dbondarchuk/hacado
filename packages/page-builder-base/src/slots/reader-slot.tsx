import type { BaseZodDictionary } from "@hacado/builder";
import {
  isEmbeddedSlot,
  ReaderBlock,
  TReaderProps,
  type TReaderBlock,
} from "@hacado/builder";
import { BlockStyle } from "../helpers/styling";
import type { StyleValue } from "../style/css-renderer";
import type { BaseStyleDictionary } from "../style/types";
import type { EmbeddedSlotData } from "./embedded-slot";

export function slotClassName(slot: EmbeddedSlotData) {
  return `pb-slot-${slot.id}`;
}

type ReaderBlockProps = TReaderProps<BaseZodDictionary>;

export function ReaderEmbeddedSlotChildren({
  slot,
  styleDefinitions,
  rest,
}: {
  slot: unknown;
  styleDefinitions: Parameters<typeof BlockStyle>[0]["styleDefinitions"];
  rest: ReaderBlockProps;
}) {
  if (!slot || !isEmbeddedSlot(slot)) return null;
  const name = slotClassName(slot);
  return (
    <>
      <BlockStyle
        name={name}
        styleDefinitions={styleDefinitions}
        styles={(slot.style ?? {}) as StyleValue<BaseStyleDictionary>}
      />
      {slot.children.map((child: unknown) => {
        const block = child as TReaderBlock;
        if (!block?.id || !block?.type) return null;
        return <ReaderBlock key={block.id} {...rest} block={block} />;
      })}
    </>
  );
}
