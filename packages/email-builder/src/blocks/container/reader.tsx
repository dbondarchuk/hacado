import { ReaderBlock } from "@hacado/builder";
import { BaseContainer } from "./base";
import { ContainerReaderProps } from "./schema";

export const ContainerReader = ({
  style,
  props,
  ...rest
}: ContainerReaderProps) => {
  const children = props?.children ?? [];
  return (
    <BaseContainer style={style}>
      {children.map((child) => (
        <ReaderBlock key={child.id} {...rest} block={child} />
      ))}
    </BaseContainer>
  );
};
