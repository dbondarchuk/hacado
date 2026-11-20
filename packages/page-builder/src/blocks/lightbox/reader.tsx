import { LightboxProvider } from "./context";
import { Lightbox } from "./lightbox";
import { LightboxReaderProps } from "./schema";

export const LightboxReader = ({
  props,
  block,
  ...rest
}: LightboxReaderProps) => {
  const { children, ...restProps } = props;
  return (
    <LightboxProvider>
      <Lightbox {...restProps} />
      {children.map((child) => (
        <rest.ReaderBlock key={child.id} {...rest} block={child} />
      ))}
    </LightboxProvider>
  );
};
