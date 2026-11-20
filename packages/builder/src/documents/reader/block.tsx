import { memo } from "react";
import { templateProps } from "../helpers/template-props";
import { BaseZodDictionary } from "../types";
import {
  BaseReaderBlockProps,
  ReaderDocumentBlocksDictionary,
  TReaderBlock,
} from "./core";

export type TReaderBlockProps = BaseReaderBlockProps & {
  [x: string]: any;
};

const readerBlockRendererCache = new WeakMap<
  object,
  React.ComponentType<TReaderBlockProps>
>();

export const getReaderBlockRenderer = <T extends BaseZodDictionary>(
  blocks: ReaderDocumentBlocksDictionary<T>,
) => {
  const cached = readerBlockRendererCache.get(blocks);
  if (cached) {
    return cached;
  }

  const ReaderBlock = ({ block, ...rest }: TReaderBlockProps) => {
    const Component = blocks[block.type]?.Reader;
    if (!Component) {
      return null;
    }

    return (
      <Component
        {...rest}
        {...templateProps(block.data, rest.args)}
        block={block}
        key={block.id}
      />
    );
  };

  ReaderBlock.displayName = "ReaderBlock";
  readerBlockRendererCache.set(blocks, ReaderBlock);
  return ReaderBlock;
};

export type TReaderProps<T extends BaseZodDictionary> = Omit<
  BaseReaderBlockProps,
  "block" | "ReaderBlock"
> & {
  blocks: ReaderDocumentBlocksDictionary<T>;
  document: TReaderBlock;
};

function ReaderInner<T extends BaseZodDictionary>({
  document,
  args,
  blocks,
  isEditor,
}: TReaderProps<T>) {
  const ReaderBlock = getReaderBlockRenderer(blocks);

  return (
    <ReaderBlock
      ReaderBlock={ReaderBlock}
      block={document}
      args={args}
      isEditor={isEditor}
    />
  );
}

export const Reader = memo(ReaderInner) as typeof ReaderInner;
