import { isEmbeddedSlot, ReaderBlock } from "@hacado/builder/reader";
import {
  BlockStyle,
  generateClassName,
} from "@hacado/page-builder-base/reader";
import { EmbeddedSlotData } from "@hacado/page-builder-base/slots";
import {
  AllStylesSchemas,
  StyleValue,
} from "@hacado/page-builder-base/style";
import { cn } from "@hacado/ui";
import type { ReactNode } from "react";
import {
  splitTableCellSlotStyles,
  tableCellInnerClassName,
} from "./cell-slot-styles";
import {
  colWidthCssPercent,
  computeSpanCovered,
  isBlock,
  normalizedColWidths,
  normalizedRowHeights,
  spannedColWidthPercent,
  TABLE_ROOT_CLASS,
} from "./grid-utils";
import { TableReaderProps } from "./schema";
import { styles } from "./styles";

function slotClassName(slot: EmbeddedSlotData) {
  return `pb-slot-${slot.id}`;
}

export const TableReader = ({
  style,
  props,
  block,
  ...rest
}: TableReaderProps) => {
  const p = props ?? {};
  const rowCount = p.rowCount ?? 1;
  const colCount = p.colCount ?? 1;
  const cells = (p.cells ?? []) as EmbeddedSlotData[];
  const colspan = p.colspan ?? [];
  const rowspan = p.rowspan ?? [];
  const colWidths = normalizedColWidths(
    p.colWidths as number[] | undefined,
    colCount,
  );
  const rowHeights = normalizedRowHeights(
    p.rowHeights as number[] | undefined,
    rowCount,
  );
  const covered = computeSpanCovered(rowCount, colCount, colspan, rowspan);

  const className = generateClassName();
  const base = block.base;

  const bodyRows: ReactNode[] = [];
  for (let r = 0; r < rowCount; r++) {
    const tds: ReactNode[] = [];
    for (let c = 0; c < colCount; c++) {
      const i = r * colCount + c;
      if (covered.has(i)) continue;
      const cs = Math.min(Math.max(colspan[i] ?? 1, 1), colCount - c);
      const rs = Math.min(Math.max(rowspan[i] ?? 1, 1), rowCount - r);
      const cell = cells[i];
      const cellWidthPct = spannedColWidthPercent(colWidths, c, cs);
      const slot =
        cell && isEmbeddedSlot(cell) ? cell : isBlock(cell) ? null : null;
      const slotStyles = slot?.style ?? {};
      const { surface, inner } = splitTableCellSlotStyles(slotStyles);
      const slotChildren = slot?.children ?? (isBlock(cell) ? [cell] : []);
      const cellClass = slot ? slotClassName(slot) : undefined;
      const innerClass = slot ? tableCellInnerClassName(slot.id) : undefined;

      tds.push(
        <td
          key={i}
          colSpan={cs}
          rowSpan={rs}
          style={{
            width: colWidthCssPercent(cellWidthPct),
            display: "table-cell",
          }}
          className={cn(
            "border border-border p-0 align-top align-stretch min-h-24",
            cellClass,
          )}
        >
          {cellClass ? (
            <BlockStyle
              name={cellClass}
              styleDefinitions={styles}
              styles={surface as StyleValue<AllStylesSchemas>}
            />
          ) : null}
          {innerClass ? (
            <BlockStyle
              name={innerClass}
              styleDefinitions={styles}
              styles={inner as StyleValue<AllStylesSchemas>}
            />
          ) : null}
          {innerClass ? (
            <div className={cn("min-h-24 w-full", innerClass)}>
              {slotChildren.map((child: any) =>
                isBlock(child) || (child?.id && child?.type) ? (
                  <ReaderBlock key={child.id} {...rest} block={child} />
                ) : null,
              )}
            </div>
          ) : (
            slotChildren.map((child: any) =>
              isBlock(child) || (child?.id && child?.type) ? (
                <ReaderBlock key={child.id} {...rest} block={child} />
              ) : null,
            )
          )}
        </td>,
      );
    }
    bodyRows.push(
      <tr
        key={r}
        style={{
          height: rowHeights[r],
          minHeight: rowHeights[r],
        }}
        className="border-b border-border last:border-b-0"
      >
        {tds}
      </tr>,
    );
  }

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <table
        className={cn(TABLE_ROOT_CLASS, className, base?.className)}
        id={base?.id}
      >
        <colgroup>
          {colWidths.map((w, ci) => (
            <col key={ci} style={{ width: colWidthCssPercent(w) }} />
          ))}
        </colgroup>
        <tbody>{bodyRows}</tbody>
      </table>
    </>
  );
};
