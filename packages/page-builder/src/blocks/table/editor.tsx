"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  EditorEmbeddedSlot,
  useBlockEditor,
  useCurrentBlock,
  useDispatchAction,
  useDocumentBlock,
  useIsSelectedEmbeddedSlot,
  usePortalContext,
} from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import {
  BlockStyle,
  useClassName,
  useResizeBlockStyles,
} from "@hacado/page-builder-base";
import {
  Button,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@hacado/ui";
import { motion } from "framer-motion";
import { GripVertical, Plus, Settings, Trash2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  splitTableCellSlotStyles,
  tableCellInnerClassName,
} from "./cell-slot-styles";
import {
  colWidthCssPercent,
  computeSpanCovered,
  editorDataColTablePercent,
  fillColumnWidthsToRemaining,
  flatIndex,
  insertColumnAfter,
  insertRowAfter,
  measureTableDataColumnsWidthPx,
  moveColumn,
  moveRow,
  normalizedColWidths,
  normalizedRowHeights,
  normalizeTableGridProps,
  removeColumnAt,
  removeRowAt,
  snapColWidthsAfterDrag,
  spannedColWidthPercent,
  splitColWidthOnInsert,
  TABLE_EDITOR_GUTTER_COL_PCT,
  TABLE_ROOT_CLASS,
} from "./grid-utils";
import { createEmptyTableCell, TableProps } from "./schema";
import { styles } from "./styles";

const MIN_ROW_PX = 40;

function snapRowHeightsAfterDrag(
  startHeights: number[],
  rowCount: number,
  rowIndex: number,
  dy: number,
): number[] {
  const r = rowIndex;
  const start = startHeights;
  const next = [...start];
  if (r + 1 < rowCount) {
    next[r] = Math.max(MIN_ROW_PX, Math.round(start[r]! + dy));
    next[r + 1] = Math.max(MIN_ROW_PX, Math.round(start[r + 1]! - dy));
  } else {
    next[r] = Math.max(MIN_ROW_PX, Math.round(start[r]! + dy));
  }
  return next;
}

/** Vertical space available for tbody rows (table height minus thead). */
function measureTbodyAvailableHeightPx(tableEl: HTMLTableElement): number {
  const thead = tableEl.tHead ?? tableEl.querySelector("thead");
  const theadH = thead instanceof HTMLElement ? thead.offsetHeight : 0;
  return Math.max(0, Math.floor(tableEl.clientHeight - theadH));
}

function fillRowHeightsToRemaining(
  heights: number[],
  rowCount: number,
  rowIndex: number,
  tableEl: HTMLTableElement,
): number[] {
  const next = [...heights];
  const inner = measureTbodyAvailableHeightPx(tableEl);
  const targetSum = Math.max(MIN_ROW_PX * rowCount, inner);
  const fillIdx = rowIndex + 1 < rowCount ? rowIndex + 1 : rowIndex;
  const sumOthers = next.reduce((s, h, i) => (i === fillIdx ? s : s + h), 0);
  next[fillIdx] = Math.max(MIN_ROW_PX, Math.round(targetSum - sumOthers));
  return next;
}

type TableResizeSession =
  | {
      kind: "col";
      pointerId: number;
      columnIndex: number;
      startClientX: number;
      startWidths: number[];
      colCount: number;
    }
  | {
      kind: "row";
      pointerId: number;
      rowIndex: number;
      startClientY: number;
      startHeights: number[];
      rowCount: number;
    };

function TableCellSpanControls({
  flat,
  col,
  row,
  colCount,
  rowCount,
  colspan,
  rowspan,
  currentProps,
  commitProps,
  isSlotSelected,
}: {
  flat: number;
  col: number;
  row: number;
  colCount: number;
  rowCount: number;
  colspan: number[];
  rowspan: number[];
  currentProps: TableProps["props"];
  commitProps: (next: TableProps["props"]) => void;
  isSlotSelected: boolean;
}) {
  const t = useI18n("builder");
  const label = (key: string) => t(key as Parameters<typeof t>[0]);
  const maxColspan = colCount - col;
  const maxRowspan = rowCount - row;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className={cn(
              "pointer-events-auto absolute bottom-1 right-1 size-6 shadow-sm",
              isSlotSelected
                ? "opacity-100"
                : "opacity-0 group-hover/cell:opacity-100",
            )}
            aria-label={label("pageBuilder.blocks.table.spanSettings")}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Settings className="size-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          className="w-44 p-2"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="mb-2 text-xs font-medium text-foreground">
            {label("pageBuilder.blocks.table.spanSettings")}
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              {label("pageBuilder.blocks.table.colspan")}
              <input
                type="number"
                min={1}
                max={maxColspan}
                className="w-14 rounded border border-input bg-background px-1.5 py-0.5 text-xs text-foreground"
                value={colspan[flat] ?? 1}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  const v = Number.isNaN(n)
                    ? (colspan[flat] ?? 1)
                    : Math.min(maxColspan, Math.max(1, Math.floor(n)));
                  const nextC = [...currentProps.colspan];
                  nextC[flat] = v;
                  commitProps({ ...currentProps, colspan: nextC });
                }}
              />
            </label>
            <label className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              {label("pageBuilder.blocks.table.rowspan")}
              <input
                type="number"
                min={1}
                max={maxRowspan}
                className="w-14 rounded border border-input bg-background px-1.5 py-0.5 text-xs text-foreground"
                value={rowspan[flat] ?? 1}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  const v = Number.isNaN(n)
                    ? (rowspan[flat] ?? 1)
                    : Math.min(maxRowspan, Math.max(1, Math.floor(n)));
                  const nextR = [...currentProps.rowspan];
                  nextR[flat] = v;
                  commitProps({ ...currentProps, rowspan: nextR });
                }}
              />
            </label>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function TableDataCell({
  flat,
  col,
  row,
  colCount,
  rowCount,
  colspan,
  rowspan,
  slot,
  effectiveColWidths,
  parentBlockId,
  commitProps,
  currentProps,
}: {
  flat: number;
  col: number;
  row: number;
  colCount: number;
  rowCount: number;
  colspan: number[];
  rowspan: number[];
  slot: TableProps["props"]["cells"][number];
  effectiveColWidths: number[];
  parentBlockId: string;
  commitProps: (next: TableProps["props"]) => void;
  currentProps: TableProps["props"];
}) {
  const slotKey = `cells.${flat}`;
  const childrenProperty = `props.cells.${flat}.children`;
  const slotClass = `pb-slot-${slot.id}`;
  const isSlotSelected = useIsSelectedEmbeddedSlot(parentBlockId, slotKey);
  const cs = Math.min(Math.max(colspan[flat] ?? 1, 1), colCount - col);
  const rs = Math.min(Math.max(rowspan[flat] ?? 1, 1), rowCount - row);
  const cellWidthPct = spannedColWidthPercent(effectiveColWidths, col, cs);
  const { surface, inner } = splitTableCellSlotStyles(
    slot.style as Record<string, unknown> | undefined,
  );
  const innerClass = tableCellInnerClassName(slot.id);

  return (
    <EditorEmbeddedSlot
      key={slot.id}
      parentBlockId={parentBlockId}
      childrenProperty={childrenProperty}
      slotKey={slotKey}
      component="td"
      colSpan={cs}
      rowSpan={rs}
      childrenInnerWrapper={motion.div}
      childrenInnerClassName={cn("min-h-24 w-full", innerClass)}
      style={{
        width: editorDataColTablePercent(cellWidthPct),
        display: "table-cell",
      }}
      className={cn(
        "group/cell border border-border p-0 align-top align-stretch min-h-24",
        slotClass,
        isSlotSelected && "ring-2 ring-inset ring-primary",
      )}
    >
      <BlockStyle
        name={slotClass}
        styleDefinitions={styles}
        styles={surface as TableProps["style"]}
      />
      <BlockStyle
        name={innerClass}
        styleDefinitions={styles}
        styles={inner as TableProps["style"]}
      />
      <TableCellSpanControls
        flat={flat}
        col={col}
        row={row}
        colCount={colCount}
        rowCount={rowCount}
        colspan={colspan}
        rowspan={rowspan}
        currentProps={currentProps}
        commitProps={commitProps}
        isSlotSelected={isSlotSelected}
      />
    </EditorEmbeddedSlot>
  );
}

function SortableColHead({
  colIndex,
  colWidthPct,
  onInsertAfter,
  onRemove,
  canRemove,
  trailing,
}: {
  colIndex: number;
  colWidthPct: number;
  onInsertAfter: () => void;
  onRemove: () => void;
  canRemove: boolean;
  trailing?: ReactNode;
}) {
  const t = useI18n("builder");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `col-${colIndex}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <th
      ref={setNodeRef}
      style={{
        ...style,
        width: editorDataColTablePercent(colWidthPct),
      }}
      className={cn(
        "relative border border-border bg-muted/40 p-1 text-left align-bottom",
        isDragging && "opacity-60",
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
            aria-label={t("pageBuilder.blocks.table.reorderColumn")}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
          <span className="text-xs font-medium text-muted-foreground">
            {t("pageBuilder.blocks.table.columnNumber", {
              number: colIndex + 1,
            })}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-1.5 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onInsertAfter();
            }}
          >
            <Plus className="size-3" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-1.5 text-xs text-destructive hover:text-destructive"
            disabled={!canRemove}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
        {trailing}
      </div>
    </th>
  );
}

function SortableDataRow({
  rowIndex,
  rowHeightPx,
  canRemove,
  onInsertAfter,
  onRemove,
  children,
  trailing,
}: {
  rowIndex: number;
  rowHeightPx: number;
  canRemove: boolean;
  onInsertAfter: () => void;
  onRemove: () => void;
  children: ReactNode;
  trailing?: ReactNode;
}) {
  const t = useI18n("builder");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `row-${rowIndex}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={{
        ...style,
        height: rowHeightPx,
        minHeight: rowHeightPx,
      }}
      className={cn(
        "relative border-t border-border",
        isDragging && "opacity-60",
      )}
    >
      <td className="w-12 border border-border bg-muted/40 p-1 align-middle">
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
            aria-label={t("pageBuilder.blocks.table.reorderRow")}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-full px-0 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onInsertAfter();
            }}
          >
            <Plus className="size-3" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-full px-0 text-xs text-destructive hover:text-destructive"
            disabled={!canRemove}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </td>
      {children}
      {trailing}
    </tr>
  );
}

const EMPTY_TABLE_PROPS: TableProps["props"] = {
  rowCount: 3,
  colCount: 3,
  cells: [],
  colspan: [],
  rowspan: [],
};

export const TableEditor = ({ props, style }: TableProps) => {
  const t = useI18n("builder");
  const currentBlock = useCurrentBlock<TableProps>();
  const documentBlock = useDocumentBlock(currentBlock.id);
  const dispatchAction = useDispatchAction();
  const onResize = useResizeBlockStyles();
  const overlayProps = useBlockEditor(currentBlock.id, onResize);
  const className = useClassName();
  const { document: portalDocument } = usePortalContext();
  const base = currentBlock?.base;

  const tableRef = useRef<HTMLTableElement>(null);

  const { ref: overlayRootRef, ...overlayRest } = overlayProps;

  const gridProps = useMemo(() => {
    const raw =
      (documentBlock?.data?.props as TableProps["props"] | undefined) ??
      (props as TableProps["props"] | undefined);
    return normalizeTableGridProps(raw ?? EMPTY_TABLE_PROPS);
  }, [documentBlock?.data?.props, props]);

  const getTableProps = useCallback((): TableProps["props"] => {
    const raw =
      (documentBlock?.data?.props as TableProps["props"] | undefined) ??
      (currentBlock.data.props as TableProps["props"] | undefined);
    return normalizeTableGridProps(raw ?? EMPTY_TABLE_PROPS);
  }, [currentBlock.data.props, documentBlock?.data?.props]);

  const rowCount = gridProps.rowCount ?? 3;
  const colCount = gridProps.colCount ?? 3;
  const colspan = gridProps.colspan;
  const rowspan = gridProps.rowspan;

  const colWidths = useMemo(
    () =>
      normalizedColWidths(
        gridProps.colWidths as number[] | undefined,
        colCount,
      ),
    [gridProps.colWidths, colCount],
  );
  const rowHeights = useMemo(
    () =>
      normalizedRowHeights(
        gridProps.rowHeights as number[] | undefined,
        rowCount,
      ),
    [gridProps.rowHeights, rowCount],
  );

  const [previewColWidths, setPreviewColWidths] = useState<number[] | null>(
    null,
  );
  const [previewRowHeights, setPreviewRowHeights] = useState<number[] | null>(
    null,
  );
  const effectiveColWidths = previewColWidths ?? colWidths;
  const effectiveRowHeights = previewRowHeights ?? rowHeights;

  const cells = gridProps.cells;

  const covered = useMemo(
    () => computeSpanCovered(rowCount, colCount, colspan, rowspan),
    [rowCount, colCount, colspan, rowspan],
  );

  const commitProps = useCallback(
    (next: TableProps["props"]) => {
      dispatchAction({
        type: "set-block-data",
        value: {
          blockId: currentBlock.id,
          data: {
            ...currentBlock.data,
            props: normalizeTableGridProps(next),
          },
        },
      });
    },
    [currentBlock, dispatchAction],
  );

  const commitPropsRef = useRef(commitProps);
  commitPropsRef.current = commitProps;

  const tablePropsRef = useRef(gridProps);
  tablePropsRef.current = gridProps;

  const [resizeSession, setResizeSession] = useState<TableResizeSession | null>(
    null,
  );

  useEffect(() => {
    if (!resizeSession) return;

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== resizeSession.pointerId) return;
      ev.preventDefault();
      if (resizeSession.kind === "col") {
        const dx = ev.clientX - resizeSession.startClientX;
        const dataWidthPx = tableRef.current
          ? measureTableDataColumnsWidthPx(tableRef.current)
          : 0;
        setPreviewColWidths(
          snapColWidthsAfterDrag(
            resizeSession.startWidths,
            resizeSession.colCount,
            resizeSession.columnIndex,
            dx,
            dataWidthPx,
          ),
        );
      } else {
        const dy = ev.clientY - resizeSession.startClientY;
        setPreviewRowHeights(
          snapRowHeightsAfterDrag(
            resizeSession.startHeights,
            resizeSession.rowCount,
            resizeSession.rowIndex,
            dy,
          ),
        );
      }
    };

    const onEnd = (ev: PointerEvent) => {
      if (ev.pointerId !== resizeSession.pointerId) return;
      ev.preventDefault();
      const p = tablePropsRef.current ?? EMPTY_TABLE_PROPS;
      if (resizeSession.kind === "col") {
        const dx = ev.clientX - resizeSession.startClientX;
        const dataWidthPx = tableRef.current
          ? measureTableDataColumnsWidthPx(tableRef.current)
          : 0;
        commitPropsRef.current({
          ...p,
          colWidths: snapColWidthsAfterDrag(
            resizeSession.startWidths,
            resizeSession.colCount,
            resizeSession.columnIndex,
            dx,
            dataWidthPx,
          ),
        });
        setPreviewColWidths(null);
      } else {
        const dy = ev.clientY - resizeSession.startClientY;
        commitPropsRef.current({
          ...p,
          rowHeights: snapRowHeightsAfterDrag(
            resizeSession.startHeights,
            resizeSession.rowCount,
            resizeSession.rowIndex,
            dy,
          ),
        });
        setPreviewRowHeights(null);
      }
      setResizeSession(null);
    };

    portalDocument.addEventListener("pointermove", onMove, { passive: false });
    portalDocument.addEventListener("pointerup", onEnd);
    portalDocument.addEventListener("pointercancel", onEnd);

    return () => {
      portalDocument.removeEventListener("pointermove", onMove);
      portalDocument.removeEventListener("pointerup", onEnd);
      portalDocument.removeEventListener("pointercancel", onEnd);
    };
  }, [resizeSession, portalDocument]);

  const fillColumnRemainingFromResizeHandle = useCallback(
    (columnIndex: number) => {
      const p = getTableProps();
      const cw = normalizedColWidths(
        p.colWidths as number[] | undefined,
        colCount,
      );
      commitProps({
        ...p,
        colWidths: fillColumnWidthsToRemaining(cw, columnIndex),
      });
    },
    [colCount, commitProps, getTableProps],
  );

  const fillRowRemainingFromResizeHandle = useCallback(
    (rowIndex: number) => {
      const tableEl = tableRef.current;
      const p = getTableProps();
      if (!tableEl) return;
      const rh = normalizedRowHeights(
        p.rowHeights as number[] | undefined,
        rowCount,
      );
      commitProps({
        ...p,
        rowHeights: fillRowHeightsToRemaining(rh, rowCount, rowIndex, tableEl),
      });
    },
    [commitProps, getTableProps, rowCount],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const aid = String(active.id);
      const oid = String(over.id);
      const p = getTableProps();
      const rb = [...p.cells];
      const rc = [...p.colspan];
      const rr = [...p.rowspan];
      const C = p.colCount ?? 3;
      const R = p.rowCount ?? rowCount;
      const cw = normalizedColWidths(p.colWidths as number[] | undefined, C);
      const rh = normalizedRowHeights(p.rowHeights as number[] | undefined, R);

      if (aid.startsWith("row-") && oid.startsWith("row-")) {
        const from = Number(aid.slice(4));
        const to = Number(oid.slice(4));
        if (Number.isNaN(from) || Number.isNaN(to)) return;
        commitProps({
          ...p,
          cells: moveRow(rb, C, from, to),
          colspan: moveRow(rc, C, from, to),
          rowspan: moveRow(rr, C, from, to),
          rowHeights: moveRow(rh, 1, from, to),
        });
        return;
      }
      if (aid.startsWith("col-") && oid.startsWith("col-")) {
        const from = Number(aid.slice(4));
        const to = Number(oid.slice(4));
        if (Number.isNaN(from) || Number.isNaN(to)) return;
        commitProps({
          ...p,
          cells: moveColumn(rb, C, from, to),
          colspan: moveColumn(rc, C, from, to),
          rowspan: moveColumn(rr, C, from, to),
          colWidths: moveColumn(cw, C, from, to),
        });
      }
    },
    [commitProps, getTableProps, rowCount],
  );

  const rowIds = useMemo(
    () => Array.from({ length: rowCount }, (_, i) => `row-${i}`),
    [rowCount],
  );
  const colIds = useMemo(
    () => Array.from({ length: colCount }, (_, i) => `col-${i}`),
    [colCount],
  );

  return (
    <>
      <BlockStyle name={className} styleDefinitions={styles} styles={style} />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <table
          ref={(el) => {
            tableRef.current = el;
            overlayRootRef(el);
          }}
          className={cn(TABLE_ROOT_CLASS, className, base?.className)}
          id={base?.id}
          {...overlayRest}
        >
          <colgroup>
            <col
              style={{ width: colWidthCssPercent(TABLE_EDITOR_GUTTER_COL_PCT) }}
            />
            {effectiveColWidths.map((w, ci) => (
              <col key={ci} style={{ width: editorDataColTablePercent(w) }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="w-12 border border-border bg-muted/20 p-1" />
              <SortableContext
                items={colIds}
                strategy={horizontalListSortingStrategy}
              >
                {Array.from({ length: colCount }, (_, c) => (
                  <SortableColHead
                    key={colIds[c]}
                    colIndex={c}
                    colWidthPct={effectiveColWidths[c] ?? 100 / colCount}
                    canRemove={colCount > 1}
                    onInsertAfter={() => {
                      const p = getTableProps();
                      const newCells = Array.from({ length: rowCount }, () =>
                        createEmptyTableCell(),
                      );
                      const next = insertColumnAfter(
                        p.cells as any[],
                        p.colspan as number[],
                        p.rowspan as number[],
                        p.colCount!,
                        p.rowCount!,
                        c,
                        newCells,
                      );
                      const cw = normalizedColWidths(
                        p.colWidths as number[] | undefined,
                        p.colCount!,
                      );
                      commitProps({
                        ...p,
                        ...next,
                        colWidths: splitColWidthOnInsert(cw, c),
                      });
                    }}
                    onRemove={() => {
                      if (colCount <= 1) return;
                      const p = getTableProps();
                      const next = removeColumnAt(
                        p.cells as any[],
                        p.colspan as number[],
                        p.rowspan as number[],
                        p.colCount!,
                        p.rowCount!,
                        c,
                      );
                      const cw = normalizedColWidths(
                        p.colWidths as number[] | undefined,
                        p.colCount!,
                      );
                      const nextCw = [...cw];
                      nextCw.splice(c, 1);
                      commitProps({
                        ...p,
                        ...next,
                        colWidths: normalizedColWidths(nextCw, next.colCount),
                      });
                    }}
                    trailing={
                      <div
                        role="separator"
                        aria-orientation="vertical"
                        title={t(
                          "pageBuilder.blocks.table.resizeFillRemainingWidth",
                        )}
                        className="absolute -right-1 top-0 z-20 h-full w-3 cursor-col-resize touch-none hover:bg-primary/20"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const start = normalizedColWidths(
                            gridProps.colWidths as number[] | undefined,
                            colCount,
                          );
                          setResizeSession({
                            kind: "col",
                            pointerId: e.pointerId,
                            columnIndex: c,
                            startClientX: e.clientX,
                            startWidths: [...start],
                            colCount,
                          });
                        }}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          fillColumnRemainingFromResizeHandle(c);
                        }}
                      />
                    }
                  />
                ))}
              </SortableContext>
            </tr>
          </thead>
          <tbody>
            <SortableContext
              items={rowIds}
              strategy={verticalListSortingStrategy}
            >
              {Array.from({ length: rowCount }, (_, r) => (
                <SortableDataRow
                  key={rowIds[r]}
                  rowIndex={r}
                  rowHeightPx={effectiveRowHeights[r] ?? 72}
                  canRemove={rowCount > 1}
                  onInsertAfter={() => {
                    const p = getTableProps();
                    const newRow = Array.from({ length: p.colCount! }, () =>
                      createEmptyTableCell(),
                    );
                    const next = insertRowAfter(
                      p.cells as any[],
                      p.colspan as number[],
                      p.rowspan as number[],
                      p.colCount!,
                      r,
                      newRow,
                    );
                    const rh = normalizedRowHeights(
                      p.rowHeights as number[] | undefined,
                      p.rowCount!,
                    );
                    const nextRh = [...rh];
                    const h = nextRh[r] ?? 72;
                    nextRh.splice(r + 1, 0, h);
                    commitProps({
                      ...p,
                      ...next,
                      rowCount: next.rowCount,
                      rowHeights: nextRh,
                    });
                  }}
                  onRemove={() => {
                    if (rowCount <= 1) return;
                    const p = getTableProps();
                    const next = removeRowAt(
                      p.cells as any[],
                      p.colspan as number[],
                      p.rowspan as number[],
                      p.colCount!,
                      r,
                    );
                    const rh = normalizedRowHeights(
                      p.rowHeights as number[] | undefined,
                      p.rowCount!,
                    );
                    const nextRh = [...rh];
                    nextRh.splice(r, 1);
                    commitProps({
                      ...p,
                      ...next,
                      rowCount: next.rowCount,
                      rowHeights: nextRh,
                    });
                  }}
                  trailing={
                    <div
                      role="separator"
                      aria-orientation="horizontal"
                      title={t(
                        "pageBuilder.blocks.table.resizeFillRemainingHeight",
                      )}
                      className="absolute bottom-0 left-12 right-0 z-20 h-2 cursor-row-resize touch-none hover:bg-primary/20"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const start = normalizedRowHeights(
                          gridProps.rowHeights as number[] | undefined,
                          rowCount,
                        );
                        setResizeSession({
                          kind: "row",
                          pointerId: e.pointerId,
                          rowIndex: r,
                          startClientY: e.clientY,
                          startHeights: [...start],
                          rowCount,
                        });
                      }}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        fillRowRemainingFromResizeHandle(r);
                      }}
                    />
                  }
                >
                  {Array.from({ length: colCount }, (_, c) => {
                    const flat = flatIndex(r, c, colCount);
                    if (covered.has(flat)) {
                      return null;
                    }
                    const slot = cells[flat];
                    if (!slot) {
                      return (
                        <td
                          key={`e-${flat}`}
                          className="border border-border p-0 align-top"
                        />
                      );
                    }
                    return (
                      <TableDataCell
                        key={slot.id}
                        flat={flat}
                        col={c}
                        row={r}
                        colCount={colCount}
                        rowCount={rowCount}
                        colspan={colspan}
                        rowspan={rowspan}
                        slot={slot}
                        effectiveColWidths={effectiveColWidths}
                        parentBlockId={currentBlock.id}
                        commitProps={commitProps}
                        currentProps={gridProps}
                      />
                    );
                  })}
                </SortableDataRow>
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </>
  );
};
