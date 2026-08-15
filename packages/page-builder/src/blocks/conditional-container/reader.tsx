import { evaluate, ReaderBlock } from "@hacado/builder";
import { ConditionalContainerReaderProps } from "./schema";

export const ConditionalContainerReader = ({
  props,
  ...rest
}: ConditionalContainerReaderProps) => {
  const thenChildren = props?.then?.children ?? [];
  const otherwiseChildren = props?.otherwise?.children ?? [];
  if (!props?.condition) return <></>;

  const result = !!evaluate(props?.condition, rest.args);

  return (
    <>
      {(result ? thenChildren : otherwiseChildren).map((child) => (
        <ReaderBlock key={child.id} {...rest} block={child} />
      ))}
    </>
  );
};
