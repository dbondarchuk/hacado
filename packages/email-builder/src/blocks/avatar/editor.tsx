"use client";

import { useCurrentBlock, useEditorArgs } from "@hacado/builder/editor";
import { useBlockEditor } from "@hacado/builder/overlay";
import { templateSafeWithError } from "@hacado/utils/string";
import { Avatar } from "./avatar";
import { AvatarProps } from "./schema";

export const AvatarEditor = ({ props, style }: AvatarProps) => {
  const args = useEditorArgs();
  const currentBlock = useCurrentBlock<AvatarProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const imageUrl = props?.imageUrl
    ? templateSafeWithError(props.imageUrl, args, true)
    : undefined;

  return (
    <Avatar
      {...overlayProps}
      style={style}
      props={{
        ...props,
        imageUrl,
      }}
    />
  );
};
