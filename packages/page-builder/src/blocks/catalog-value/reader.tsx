import { CatalogValueClient } from "./client-value";
import { CatalogValueReaderProps } from "./schema";
import { CatalogValueServerWrapper } from "./server-wrapper";

const isServer = typeof window === "undefined";

export const CatalogValueReader = ({
  props,
  style,
  block,
  isEditor,
}: CatalogValueReaderProps & { isEditor?: boolean }) => {
  if (isEditor || !isServer) {
    return (
      <CatalogValueClient
        props={props}
        style={style}
        blockBase={block.base}
        isEditor={isEditor}
      />
    );
  }

  return (
    <CatalogValueServerWrapper
      props={props}
      style={style}
      blockBase={block.base}
    />
  );
};
