import { CSSProperties, forwardRef, JSX } from "react";
import { getPadding } from "../../style-inputs/helpers/styles";
import { ContainerProps } from "./schema";

function getBorder(style: ContainerProps["style"]) {
  if (!style || !style.borderColor) {
    return undefined;
  }

  return `1px solid ${style.borderColor}`;
}

export const BaseContainer = forwardRef<
  HTMLDivElement,
  Omit<ContainerProps, "props"> & {
    children: JSX.Element | JSX.Element[] | null;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  }
>(({ style, children, onClick }, ref) => {
  const wStyle: CSSProperties = {
    backgroundColor: style?.backgroundColor ?? undefined,
    border: getBorder(style),
    borderRadius: style?.borderRadius ?? undefined,
    padding: getPadding(style?.padding),
  };

  return (
    <div style={wStyle} ref={ref} onClick={onClick}>
      {children}
    </div>
  );
});
