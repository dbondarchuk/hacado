import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { cn, Markdown } from "@hacado/ui";
import type React from "react";
import type { ResolvedCatalogValue } from "./format";
import type { CatalogValueProps } from "./schema";
import { styles } from "./styles";

type CatalogValueComponentProps = {
  resolved: ResolvedCatalogValue;
  multiline: boolean;
  style?: CatalogValueProps["style"];
  blockBase?: { className?: string; id?: string };
  isEditor?: boolean;
  overlayProps?: {
    ref?: React.Ref<HTMLElement>;
    onClick?: (event: React.MouseEvent) => void;
  };
  placeholder?: string;
};

export const CatalogValueComponent = ({
  resolved,
  multiline,
  style,
  blockBase,
  isEditor,
  overlayProps,
  placeholder,
}: CatalogValueComponentProps) => {
  const className = generateClassName();
  const showPlaceholder = resolved.kind === "empty" && placeholder;

  const body =
    resolved.kind === "markdown" ? (
      <Markdown
        markdown={resolved.markdown}
        prose="none"
        className="[&_p]:my-0 [&_p]:py-0"
      />
    ) : showPlaceholder ? (
      placeholder
    ) : resolved.kind === "text" ? (
      resolved.text
    ) : null;

  const shared = {
    className: cn(
      className,
      blockBase?.className,
      multiline && "whitespace-pre-line",
    ),
    id: blockBase?.id,
    ...(isEditor ? overlayProps : {}),
  };

  return (
    <>
      <BlockStyle
        name={className}
        styleDefinitions={styles}
        styles={style}
        isEditor={isEditor}
      />
      {multiline ? (
        <div {...(shared as React.ComponentProps<"div">)}>{body}</div>
      ) : (
        <span {...(shared as React.ComponentProps<"span">)}>{body}</span>
      )}
    </>
  );
};
