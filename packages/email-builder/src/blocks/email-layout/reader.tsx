import { ReaderBlock, ReaderProps } from "@hacado/builder";
import { getFontFamily, getPadding } from "../../style-inputs/helpers/styles";
import { EmailLayoutDefaultProps, EmailLayoutReaderProps } from "./schema";

export const EmailLayoutReader = ({
  args,
  document,
  ...props
}: ReaderProps<EmailLayoutReaderProps>) => {
  const children = props.children ?? [];
  return (
    <>
      {props.previewText && (
        <div style={{ display: "none", maxHeight: "0px", overflow: "hidden" }}>
          {props.previewText}
          &nbsp;&#8204;&nbsp;&#124;&nbsp;&#8204;&nbsp;
        </div>
      )}
      <div
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
          minHeight: "100%",
          width: "100%",
        }}
      >
        <table
          align="center"
          width="100%"
          style={{
            margin: "0 auto",
            maxWidth: props.maxWidth ? `${props.maxWidth}px` : undefined,
            backgroundColor:
              props.canvasColor ?? EmailLayoutDefaultProps.canvasColor,
            borderRadius: props.borderRadius ?? undefined,
            border: props.borderColor
              ? `1px solid ${props.borderColor}`
              : undefined,
            borderCollapse: "separate",
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};
