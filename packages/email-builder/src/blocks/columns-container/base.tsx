import type { NestedOmit } from "@hacado/types";
import { CSSProperties, forwardRef, JSX } from "react";
import { getPadding } from "../../style-inputs/helpers/styles";
import { ColumnsContainerProps, ColumnsContainerPropsDefaults } from "./schema";

type TColumn = JSX.Element | JSX.Element[] | null;

export const BaseColumnsContainer = forwardRef<
  HTMLDivElement,
  NestedOmit<ColumnsContainerProps, "props.columns"> & {
    columns?: TColumn[];
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  }
>(({ style, props, columns, onClick }, ref) => {
  const wStyle: CSSProperties = {
    backgroundColor: style?.backgroundColor ?? undefined,
    padding: getPadding(style?.padding),
  };

  const blockProps = {
    columnsCount:
      props?.columnsCount ?? ColumnsContainerPropsDefaults.props.columnsCount,
    columnsGap:
      props?.columnsGap ?? ColumnsContainerPropsDefaults.props.columnsGap,
    contentAlignment:
      props?.contentAlignment ??
      ColumnsContainerPropsDefaults.props.contentAlignment,
    fixedWidths: props?.fixedWidths,
  };

  return (
    <div style={wStyle} ref={ref} onClick={onClick}>
      <table
        align="center"
        width="100%"
        cellPadding="0"
        border={0}
        style={{ tableLayout: "fixed", borderCollapse: "collapse" }}
      >
        <tbody style={{ width: "100%" }}>
          <tr style={{ width: "100%" }}>
            <TableCell index={0} props={blockProps} columns={columns} />
            <TableCell index={1} props={blockProps} columns={columns} />
            <TableCell index={2} props={blockProps} columns={columns} />
          </tr>
        </tbody>
      </table>
    </div>
  );
});

type Props = {
  props: {
    fixedWidths: ColumnsContainerProps["props"]["fixedWidths"];
    columnsCount: ColumnsContainerProps["props"]["columnsGap"];
    columnsGap: number;
    contentAlignment: ColumnsContainerProps["props"]["contentAlignment"];
  };
  index: number;
  columns?: TColumn[];
};

const TableCell = ({ index, props, columns }: Props) => {
  const contentAlignment =
    props?.contentAlignment ??
    ColumnsContainerPropsDefaults.props.contentAlignment;
  const columnsCount =
    props?.columnsCount ?? ColumnsContainerPropsDefaults.props.columnsCount;

  if (columnsCount === 2 && index === 2) {
    return null;
  }

  const style: CSSProperties = {
    boxSizing: "content-box",
    verticalAlign: contentAlignment,
    paddingLeft: getPaddingBefore(index, props),
    paddingRight: getPaddingAfter(index, props),
    width: props.fixedWidths?.[index] ?? undefined,
  };
  const children = (columns && columns[index]) ?? null;
  return <td style={style}>{children}</td>;
};

function getPaddingBefore(
  index: number,
  { columnsGap, columnsCount }: Props["props"],
) {
  if (index === 0) {
    return 0;
  }
  if (columnsCount === 2) {
    return columnsGap / 2;
  }
  if (index === 1) {
    return columnsGap / 3;
  }
  return (2 * columnsGap) / 3;
}

function getPaddingAfter(
  index: number,
  { columnsGap, columnsCount }: Props["props"],
) {
  if (columnsCount === 2) {
    if (index === 0) {
      return columnsGap / 2;
    }
    return 0;
  }

  if (index === 0) {
    return (2 * columnsGap) / 3;
  }
  if (index === 1) {
    return columnsGap / 3;
  }
  return 0;
}
