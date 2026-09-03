import { ReaderBlock, ReaderProps } from "@hacado/builder";
import {
  getFontFamily,
  ReaderProvider,
  ReplaceOriginalColors,
} from "@hacado/page-builder-base/reader";
import { COLORS, getColorStyle } from "@hacado/page-builder-base/style";
import { cn } from "@hacado/ui";
import { PageLayoutReaderProps } from "./schema";

export const PageLayoutReader = ({
  args,
  document,
  ...props
}: ReaderProps<PageLayoutReaderProps>) => {
  const children = props.children ?? [];
  return (
    <ReaderProvider>
      <div
        style={{
          backgroundColor: getColorStyle(
            props.backgroundColor ?? COLORS.background.value,
          ),
          color: getColorStyle(props.textColor ?? COLORS.foreground.value),
          fontFamily: getFontFamily(props.fontFamily),
          fontSize: "16px",
          fontWeight: "400",
          letterSpacing: "0.15008px",
          lineHeight: "1.5",
          margin: "0",
          width: "100%",
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        className="page-layout-reader"
      >
        <ReplaceOriginalColors />
        <div
          className={cn(
            "w-full flex flex-col",
            !props.fullWidth && "container mx-auto",
          )}
        >
          {children.map((child) => (
            <ReaderBlock
              blocks={props.blocks}
              key={child.id}
              block={child}
              args={args}
              document={document}
              isEditor={props.isEditor}
            />
          ))}
        </div>
      </div>
    </ReaderProvider>
  );
};
