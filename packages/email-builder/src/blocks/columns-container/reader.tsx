import { ReaderBlock, TReaderBlock } from "@hacado/builder";
import { BaseColumnsContainer } from "./base";
import { ColumnsContainerReaderProps } from "./schema";

export const ColumnsContainerReader = ({
  style,
  props,
  ...rest
}: ColumnsContainerReaderProps) => {
  const { columns, ...restProps } = props ?? {};
  let cols = undefined;
  if (columns) {
    cols = columns.map((col) =>
      col.children.map((child: TReaderBlock) => (
        <ReaderBlock key={child.id} {...rest} block={child} />
      )),
    );
  }

  return (
    <BaseColumnsContainer props={restProps} columns={cols} style={style} />
  );
};
