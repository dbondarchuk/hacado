import React, { forwardRef } from "react";
import { getPadding } from "../../style-inputs/helpers/styles";
import { DividerProps, DividerPropsDefaults } from "./schema";

export const Divider = forwardRef<
  HTMLDivElement,
  DividerProps & {
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  }
>(({ style, props, onClick }, ref) => {
  const st: React.CSSProperties = {
    padding: getPadding(style?.padding),
    backgroundColor: style?.backgroundColor ?? undefined,
  };

  const borderTopWidth =
    props?.lineHeight ?? DividerPropsDefaults.props.lineHeight;

  const borderTopColor =
    props?.lineColor ?? DividerPropsDefaults.props.lineColor;

  return (
    <div style={st} ref={ref} onClick={onClick}>
      <hr
        style={{
          width: "100%",
          border: "none",
          borderTop: `${borderTopWidth}px solid ${borderTopColor}`,
          margin: 0,
        }}
      />
    </div>
  );
});
