"use client";

import { Fragment } from "react";

import {
  EditorChildren,
  useBlockEditor,
  useCurrentBlock,
  useSetSelectedBlockId,
} from "@timelish/builder";
import { getFontFamily, getPadding } from "../../style-inputs/helpers/styles";
import { EmailLayoutDefaultProps, EmailLayoutProps } from "./schema";

export const EmailLayoutEditor = (props: EmailLayoutProps) => {
  const currentBlock = useCurrentBlock<EmailLayoutProps>();
  const setSelectedBlockId = useSetSelectedBlockId();
  const overlayProps = useBlockEditor(currentBlock.id);
  return (
    <Fragment>
      {props.previewText && (
        <div style={{ display: "none", maxHeight: "0px", overflow: "hidden" }}>
          {props.previewText}
          &nbsp;&#8204;&nbsp;&#204;&nbsp;&#8204;&nbsp;
        </div>
      )}
      <div
        {...overlayProps}
        onClick={() => {
          setSelectedBlockId(null);
        }}
        style={{
          backgroundColor:
            props.backdropColor ?? EmailLayoutDefaultProps.backdropColor,
          color: props.textColor ?? EmailLayoutDefaultProps.textColor,
          fontFamily: getFontFamily(props.fontFamily),
          fontSize: "16px",
          fontWeight: "400",
          letterSpacing: "0.15008px",
          lineHeight: "1.5",
          margin: "0",
          padding: "32px 0",
          width: "100%",
          minHeight: "100%",
        }}
      >
        <table
          align="center"
          width="100%"
          style={{
            margin: "0 auto",
            maxWidth:
              props.maxWidth && props.maxWidth > 0
                ? `${props.maxWidth}px`
                : undefined,
            backgroundColor:
              props.canvasColor ?? EmailLayoutDefaultProps.canvasColor,
            borderRadius: props.borderRadius ?? undefined,
            borderCollapse: "separate",
            border: props.borderColor
              ? `1px solid ${props.borderColor}`
              : undefined,
            padding: getPadding(
              props.padding ?? EmailLayoutDefaultProps.padding,
            ),
          }}
          role="presentation"
          cellSpacing="0"
          cellPadding="0"
          border={0}
        >
          <tbody>
            <tr style={{ width: "100%" }}>
              <td>
                <EditorChildren blockId={currentBlock.id} property="" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Fragment>
  );
};
