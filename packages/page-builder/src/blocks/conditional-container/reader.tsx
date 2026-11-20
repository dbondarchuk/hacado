import { evaluate } from "@hacado/builder/helpers";
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
        <rest.ReaderBlock key={child.id} {...rest} block={child} />
      ))}
    </>
  );
};
