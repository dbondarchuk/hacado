import {
  EditorArgsContext,
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
  useEditorArgs,
} from "@hacado/builder";
import { BlockStyle, useClassName } from "@hacado/page-builder-base";
import { useMemo } from "react";
import { blogPostsListFixtures } from "../fixtures";
import { BlogPostContainerProps, styles } from "./schema";

export const BlogPostContainerEditor = ({
  style,
  props,
}: BlogPostContainerProps) => {
  const currentBlock = useCurrentBlock<BlogPostContainerProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const existingArgs = useEditorArgs();

  const className = useClassName();
  const base = currentBlock.base;
  const metadata = currentBlock?.metadata;
  const appId = metadata?.blogAppId;

  // Extend args with fixture post for child blocks
  const extendedArgs = useMemo(
    () => ({
      ...existingArgs,
      post: blogPostsListFixtures[0],
      blogAppId: appId ?? existingArgs?.blogAppId,
    }),
    [existingArgs, appId],
  );

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={currentBlock.data?.style}
      />
      <div className={className} id={base?.id} {...overlayProps}>
        <EditorArgsContext.Provider value={extendedArgs}>
          <EditorChildren blockId={currentBlock.id} property="props" />
        </EditorArgsContext.Provider>
      </div>
    </>
  );
};
