import type { TEditorBlock } from "@hacado/builder";
import { coerceArray } from "@hacado/builder";
import type { TableProps } from "./schema";

type TableCellSlot = TableProps["props"]["cells"][number];

/** Ensure flat grid arrays were not corrupted by object spread. */
export function normalizeTableGridProps(
  props: TableProps["props"],
): TableProps["props"] {
  return {
    ...props,
    cells: coerceArray<TableCellSlot>(props.cells),
    colspan: coerceArray<number>(props.colspan),
    rowspan: coerceArray<number>(props.rowspan),
  };
}

/** Table fills container; data `colWidths` are % and sum to 100. */
export const TABLE_ROOT_CLASS =
  "w-full table-fixed border-collapse overflow-x-auto";

/** Minimum width per data column (%). */
export const MIN_COL_PCT = 5;

/** Editor gutter column share of table width (%). */
export const TABLE_EDITOR_GUTTER_COL_PCT = 5;

/** Fallback gutter width (px) when measuring before layout. */
export const TABLE_EDITOR_GUTTER_COL_PX = 48;

export function flatIndex(row: number, col: number, colCount: number) {
  return row * colCount + col;
}

export function chunkByColumns<T>(flat: T[], colCount: number): T[][] {
  const rows: T[][] = [];
  for (let r = 0; r < flat.length / colCount; r++) {
    rows.push(flat.slice(r * colCount, (r + 1) * colCount));
  }
  return rows;
}

export function flattenRows<T>(rows: T[][]): T[] {
  return rows.flat();
}

export function moveRow<T>(
  flat: T[],
  colCount: number,
  from: number,
  to: number,
): T[] {
  const rows = chunkByColumns(flat, colCount);
  const next = rows.slice();
  const [row] = next.splice(from, 1);
  next.splice(to, 0, row);
  return flattenRows(next);
}

export function moveColumn<T>(
  flat: T[],
  colCount: number,
  from: number,
  to: number,
): T[] {
  const rows = chunkByColumns(flat, colCount);
  const next = rows.map((row) => {
    const copy = row.slice();
    const [cell] = copy.splice(from, 1);
    copy.splice(to, 0, cell);
    return copy;
  });
  return flattenRows(next);
}

export function addRowAtEnd<T>(
  flat: T[],
  colCount: number,
  newCells: T[],
): T[] {
  return [...flat, ...newCells];
}

export function removeLastRow<T>(flat: T[], colCount: number): T[] {
  if (flat.length <= colCount) return flat;
  return flat.slice(0, flat.length - colCount);
}

export function addColumnAtEnd<T>(
  flat: T[],
  colCount: number,
  rowCount: number,
  newCells: T[],
): T[] {
  const out: T[] = [];
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      out.push(flat[flatIndex(r, c, colCount)]!);
    }
    out.push(newCells[r]!);
  }
  return out;
}

export function removeLastColumn<T>(flat: T[], colCount: number): T[] {
  if (colCount <= 1) return flat;
  const rowCount = flat.length / colCount;
  const out: T[] = [];
  for (let r = 0; r < rowCount; r++) {
    for (let c = 0; c < colCount - 1; c++) {
      out.push(flat[flatIndex(r, c, colCount)]!);
    }
  }
  return out;
}

/** Flat indices covered by another cell's span (not including anchor index). */
export function computeSpanCovered(
  rowCount: number,
  colCount: number,
  colspan: number[],
  rowspan: number[],
): Set<number> {
  const total = rowCount * colCount;
  const covered = new Set<number>();
  for (let i = 0; i < total; i++) {
    const r = Math.floor(i / colCount);
    const c = i % colCount;
    const cs = Math.min(Math.max(colspan[i] ?? 1, 1), colCount - c);
    const rs = Math.min(Math.max(rowspan[i] ?? 1, 1), rowCount - r);
    for (let dr = 0; dr < rs; dr++) {
      for (let dc = 0; dc < cs; dc++) {
        if (dr === 0 && dc === 0) continue;
        const ni = flatIndex(r + dr, c + dc, colCount);
        if (ni < total) covered.add(ni);
      }
    }
  }
  return covered;
}

export function isBlock(v: unknown): v is TEditorBlock {
  return (
    !!v &&
    typeof v === "object" &&
    "id" in v &&
    "type" in v &&
    typeof (v as TEditorBlock).type === "string"
  );
}

export type TableGridState = {
  rowCount: number;
  colCount: number;
  cells: TableCellSlot[];
  colspan: number[];
  rowspan: number[];
  colWidths?: number[];
  rowHeights?: number[];
};

const DEFAULT_ROW_H = 72;

function padNumbers(prev: number[] | undefined, len: number, fill: number) {
  const out = [...(prev ?? [])].slice(0, len);
  while (out.length < len) out.push(fill);
  return out;
}

function roundPct(n: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

function isLikelyPxColWidths(widths: number[]): boolean {
  return widths.some((w) => w > 100);
}

function pxColWidthsToPercent(widths: number[]): number[] {
  const sum = widths.reduce((a, b) => a + b, 0) || 1;
  return widths.map((w) => (w / sum) * 100);
}

/** Data columns only - values sum to 100 (%). */
export function normalizeColWidthsSum100(widths: number[]): number[] {
  if (widths.length === 0) return [];
  let w = [...widths].map((x) => Math.max(0, x));
  if (isLikelyPxColWidths(w)) {
    w = pxColWidthsToPercent(w);
  }
  const sum = w.reduce((a, b) => a + b, 0) || 1;
  w = w.map((x) => (x / sum) * 100);
  const out = w.map((x) => Math.max(MIN_COL_PCT, roundPct(x)));
  const drift = 100 - out.reduce((a, b) => a + b, 0);
  out[out.length - 1] = roundPct(
    Math.max(MIN_COL_PCT, out[out.length - 1]! + drift),
  );
  return out;
}

export function equalColWidthPercents(colCount: number): number[] {
  const n = Math.max(1, colCount);
  return normalizeColWidthsSum100(Array.from({ length: n }, () => 100 / n));
}

export function normalizedColWidths(
  widths: number[] | undefined,
  colCount: number,
) {
  const n = Math.max(1, colCount);
  const fill = 100 / n;
  const raw = padNumbers(widths, n, fill);
  return normalizeColWidthsSum100(raw);
}

export function colWidthCssPercent(pct: number): string {
  return `${roundPct(pct)}%`;
}

export function spannedColWidthPercent(
  widths: number[],
  startCol: number,
  span: number,
): number {
  return widths.slice(startCol, startCol + span).reduce((a, b) => a + b, 0);
}

/** Maps stored data-column % to % of full table width (editor gutter reserved). */
export function editorDataColTablePercent(dataColPct: number): string {
  const scale = (100 - TABLE_EDITOR_GUTTER_COL_PCT) / 100;
  return colWidthCssPercent(dataColPct * scale);
}

export function measureTableDataColumnsWidthPx(
  tableEl: HTMLTableElement,
): number {
  const firstRow = tableEl.rows[0];
  const gutter =
    firstRow?.cells[0] instanceof HTMLElement
      ? firstRow.cells[0].offsetWidth
      : TABLE_EDITOR_GUTTER_COL_PX;
  return Math.max(0, tableEl.clientWidth - gutter);
}

export function snapColWidthsAfterDrag(
  startWidths: number[],
  colCount: number,
  columnIndex: number,
  dxPx: number,
  dataWidthPx: number,
): number[] {
  const dPct = dataWidthPx > 0 ? (dxPx / dataWidthPx) * 100 : 0;
  const next = [...startWidths];
  const c = columnIndex;
  const min = MIN_COL_PCT;

  const transferBetween = (left: number, right: number, delta: number) => {
    const maxFromLeft = next[left]! - min;
    const maxFromRight = next[right]! - min;
    const transfer = Math.max(-maxFromRight, Math.min(maxFromLeft, delta));
    next[left] = roundPct(next[left]! + transfer);
    next[right] = roundPct(next[right]! - transfer);
  };

  if (c + 1 < colCount) {
    transferBetween(c, c + 1, dPct);
  } else if (c > 0) {
    transferBetween(c - 1, c, dPct);
  }
  return normalizeColWidthsSum100(next);
}

export function fillColumnWidthsToRemaining(
  widths: number[],
  columnIndex: number,
): number[] {
  const next = [...widths];
  const fillIdx = columnIndex + 1 < next.length ? columnIndex + 1 : columnIndex;
  const sumOthers = next.reduce((s, x, i) => (i === fillIdx ? s : s + x), 0);
  next[fillIdx] = Math.max(MIN_COL_PCT, roundPct(100 - sumOthers));
  return normalizeColWidthsSum100(next);
}

export function splitColWidthOnInsert(
  widths: number[],
  afterIndex: number,
): number[] {
  const next = [...widths];
  const i = Math.min(Math.max(0, afterIndex), next.length - 1);
  const half = next[i]! / 2;
  next[i] = roundPct(half);
  next.splice(i + 1, 0, roundPct(half));
  return normalizeColWidthsSum100(next);
}

export function normalizedRowHeights(
  heights: number[] | undefined,
  rowCount: number,
) {
  return padNumbers(heights, rowCount, DEFAULT_ROW_H);
}

export function resizeTableDimensions(
  prev: TableGridState,
  nextRowCount: number,
  nextColCount: number,
  createCell: () => TableCellSlot,
): TableGridState {
  const rowCount = Math.min(30, Math.max(1, Math.floor(nextRowCount)));
  const colCount = Math.min(30, Math.max(1, Math.floor(nextColCount)));
  const oldR = Math.max(1, prev.rowCount);
  const oldC = Math.max(1, prev.colCount);
  const expected = oldR * oldC;
  const cells = coerceArray<TableCellSlot>(prev.cells).slice(0, expected);
  const colspan = coerceArray<number>(prev.colspan).slice(0, expected);
  const rowspan = coerceArray<number>(prev.rowspan).slice(0, expected);
  while (cells.length < expected) {
    cells.push(createCell());
    colspan.push(1);
    rowspan.push(1);
  }

  let colWidths = normalizedColWidths(prev.colWidths, oldC);
  let rowHeights = padNumbers(prev.rowHeights, oldR, DEFAULT_ROW_H);

  if (nextColCount !== oldC) {
    colWidths = equalColWidthPercents(nextColCount);
  }

  if (nextRowCount > oldR) {
    for (let r = oldR; r < nextRowCount; r++) {
      rowHeights.push(DEFAULT_ROW_H);
    }
  } else if (nextRowCount < oldR) {
    rowHeights = rowHeights.slice(0, nextRowCount);
  }

  const gridB = chunkByColumns(cells, oldC);
  const gridC = chunkByColumns(colspan, oldC);
  const gridR = chunkByColumns(rowspan, oldC);

  if (nextColCount > oldC) {
    for (let r = 0; r < gridB.length; r++) {
      for (let k = oldC; k < nextColCount; k++) {
        gridB[r]!.push(createCell());
        gridC[r]!.push(1);
        gridR[r]!.push(1);
      }
    }
  } else if (nextColCount < oldC) {
    for (const row of gridB) row.splice(nextColCount);
    for (const row of gridC) row.splice(nextColCount);
    for (const row of gridR) row.splice(nextColCount);
  }

  if (nextRowCount > gridB.length) {
    for (let r = gridB.length; r < nextRowCount; r++) {
      gridB.push(Array.from({ length: nextColCount }, () => createCell()));
      gridC.push(Array.from({ length: nextColCount }, () => 1));
      gridR.push(Array.from({ length: nextColCount }, () => 1));
    }
  } else if (nextRowCount < gridB.length) {
    gridB.splice(nextRowCount);
    gridC.splice(nextRowCount);
    gridR.splice(nextRowCount);
  }

  return {
    rowCount,
    colCount,
    cells: flattenRows(gridB),
    colspan: flattenRows(gridC),
    rowspan: flattenRows(gridR),
    colWidths: normalizedColWidths(colWidths, nextColCount),
    rowHeights: padNumbers(rowHeights, nextRowCount, DEFAULT_ROW_H),
  };
}

export function removeRowAt(
  cells: TableCellSlot[],
  colspan: number[],
  rowspan: number[],
  colCount: number,
  rowIndex: number,
): {
  cells: TableCellSlot[];
  colspan: number[];
  rowspan: number[];
  rowCount: number;
} {
  const nextB = [...cells];
  const nextC = [...colspan];
  const nextR = [...rowspan];
  const start = rowIndex * colCount;
  nextB.splice(start, colCount);
  nextC.splice(start, colCount);
  nextR.splice(start, colCount);
  return {
    cells: nextB,
    colspan: nextC,
    rowspan: nextR,
    rowCount: nextB.length / colCount,
  };
}

export function insertRowAfter(
  cells: TableCellSlot[],
  colspan: number[],
  rowspan: number[],
  colCount: number,
  rowIndex: number,
  newRow: TableCellSlot[],
): {
  cells: TableCellSlot[];
  colspan: number[];
  rowspan: number[];
  rowCount: number;
} {
  const nextB = [...cells];
  const nextC = [...colspan];
  const nextR = [...rowspan];
  const insertAt = (rowIndex + 1) * colCount;
  nextB.splice(insertAt, 0, ...newRow);
  nextC.splice(insertAt, 0, ...Array.from({ length: newRow.length }, () => 1));
  nextR.splice(insertAt, 0, ...Array.from({ length: newRow.length }, () => 1));
  return {
    cells: nextB,
    colspan: nextC,
    rowspan: nextR,
    rowCount: nextB.length / colCount,
  };
}

export function removeColumnAt(
  cells: TableCellSlot[],
  colspan: number[],
  rowspan: number[],
  colCount: number,
  rowCount: number,
  colIndex: number,
): {
  cells: TableCellSlot[];
  colspan: number[];
  rowspan: number[];
  colCount: number;
} {
  const gB = chunkByColumns([...cells], colCount);
  const gC = chunkByColumns([...colspan], colCount);
  const gR = chunkByColumns([...rowspan], colCount);
  for (let r = 0; r < rowCount; r++) {
    gB[r]!.splice(colIndex, 1);
    gC[r]!.splice(colIndex, 1);
    gR[r]!.splice(colIndex, 1);
  }
  return {
    cells: flattenRows(gB),
    colspan: flattenRows(gC),
    rowspan: flattenRows(gR),
    colCount: colCount - 1,
  };
}

export function insertColumnAfter(
  cells: TableCellSlot[],
  colspan: number[],
  rowspan: number[],
  colCount: number,
  rowCount: number,
  colIndex: number,
  newCells: TableCellSlot[],
): {
  cells: TableCellSlot[];
  colspan: number[];
  rowspan: number[];
  colCount: number;
} {
  const gB = chunkByColumns([...cells], colCount);
  const gC = chunkByColumns([...colspan], colCount);
  const gR = chunkByColumns([...rowspan], colCount);
  for (let r = 0; r < rowCount; r++) {
    gB[r]!.splice(colIndex + 1, 0, newCells[r]!);
    gC[r]!.splice(colIndex + 1, 0, 1);
    gR[r]!.splice(colIndex + 1, 0, 1);
  }
  return {
    cells: flattenRows(gB),
    colspan: flattenRows(gC),
    rowspan: flattenRows(gR),
    colCount: colCount + 1,
  };
}
