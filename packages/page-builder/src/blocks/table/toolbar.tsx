"use client";

import { ConfigurationProps } from "@hacado/builder";
import { ShortcutsToolbar } from "@hacado/page-builder-base";
import { useCallback, useMemo } from "react";
import { normalizeTableGridProps, resizeTableDimensions } from "./grid-utils";
import { createEmptyTableCell, TableProps } from "./schema";
import { tableBlockShortcuts, tableCellShortcuts } from "./shortcuts";
import { TableSizePicker } from "./table-size-picker";

export const TableToolbar = (props: ConfigurationProps<TableProps>) => {
  const isCell = props.selectedSlot?.slotKey.startsWith("cells.") ?? false;

  const gridProps = useMemo(() => {
    const p = props.data.props;
    if (!p) return { rowCount: 3, colCount: 3 };
    const normalized = normalizeTableGridProps(p);
    return {
      rowCount: normalized.rowCount ?? 3,
      colCount: normalized.colCount ?? 3,
    };
  }, [props.data.props]);

  const setDimensions = useCallback(
    (rowCount: number, colCount: number) => {
      const p = props.data.props;
      if (!p) return;
      const normalized = normalizeTableGridProps(p);
      const next = resizeTableDimensions(
        normalized,
        rowCount,
        colCount,
        createEmptyTableCell,
      );
      props.setData({
        ...props.data,
        props: { ...p, ...next },
      });
    },
    [props],
  );

  if (isCell) {
    return (
      <ShortcutsToolbar
        shortcuts={tableCellShortcuts}
        data={props.data}
        setData={props.setData}
      />
    );
  }

  return (
    <>
      <TableSizePicker
        rowCount={gridProps.rowCount}
        colCount={gridProps.colCount}
        onSelect={setDimensions}
      />
      <ShortcutsToolbar
        shortcuts={tableBlockShortcuts}
        data={props.data}
        setData={props.setData}
      />
    </>
  );
};
