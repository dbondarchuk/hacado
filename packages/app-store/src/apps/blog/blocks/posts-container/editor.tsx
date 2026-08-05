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
import { BlogPostsContainerProps, styles } from "./schema";

export const BlogPostsContainerEditor = ({
  style,
  props,
}: BlogPostsContainerProps) => {
  const currentBlock = useCurrentBlock<BlogPostsContainerProps>();
  const overlayProps = useBlockEditor(currentBlock.id);
  const existingArgs = useEditorArgs();

  const className = useClassName();
  const base = currentBlock.base;
  const metadata = currentBlock?.metadata;
  const appId = metadata?.blogAppId;

  // Extend args with fixture posts for child blocks
  const extendedArgs = useMemo(
    () => ({
      ...existingArgs,
      posts: blogPostsListFixtures,
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
