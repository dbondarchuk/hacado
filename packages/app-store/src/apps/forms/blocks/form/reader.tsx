import { ReplaceOriginalColors } from "@hacado/page-builder-base";
import { FormBlockEditorWrapper } from "./editor-wrapper";
import { FormBlockReaderProps } from "./schema";
import { FormBlockServerWrapper } from "./server-wrapper";

const isServer = typeof window === "undefined";

export const FormBlockReader = ({
  style,
  props,
  block,
  args,
  isEditor,
  ...rest
}: FormBlockReaderProps & { isEditor?: boolean }) => {
  const metadata = block?.metadata as { formsAppId?: string } | undefined;
  const appId = metadata?.formsAppId;

  if (isEditor || !isServer) {
    return (
      <>
        <ReplaceOriginalColors />
        <FormBlockEditorWrapper
          props={props}
          style={style}
          blockBase={block?.base}
          appId={appId}
          args={args}
        />
      </>
    );
  }

  return (
    <FormBlockServerWrapper
      props={props}
      style={style}
      blockBase={block?.base}
      appId={appId}
      args={args}
    />
  );
};
