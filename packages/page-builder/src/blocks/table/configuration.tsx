"use client";

import {
  ConfigurationProps,
  SliderInput,
  useBlock,
  useDocumentBlock,
  useInspectBlockId,
} from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { SlotOrBlockStylesPanel } from "@timelish/page-builder-base";
import { deepMemo } from "@timelish/ui";
import { Columns3, Rows3 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { normalizeTableGridProps, resizeTableDimensions } from "./grid-utils";
import { createEmptyTableCell, TableProps } from "./schema";
import { tableBlockShortcuts, tableCellShortcuts } from "./shortcuts";
import { styles } from "./styles";

export const TableConfiguration = deepMemo(
  ({
    data,
    setData,
    base,
    onBaseChange,
    selectedSlot,
  }: ConfigurationProps<TableProps>) => {
    const t = useI18n("builder");
    const inspectBlockId = useInspectBlockId();
    const liveBlock = useBlock(inspectBlockId ?? "");
    const documentBlock = useDocumentBlock(inspectBlockId ?? "");

    const liveData = useMemo((): TableProps => {
      const raw =
        (documentBlock?.data as TableProps | undefined) ??
        (liveBlock?.data as TableProps | undefined) ??
        data;
      if (!raw?.props) return data;
      return {
        ...raw,
        props: normalizeTableGridProps(raw.props),
      };
    }, [data, documentBlock?.data, liveBlock?.data]);

    const updateStyle = useCallback(
      (s: unknown) => {
        if (!liveBlock) return;
        setData({
          ...(liveBlock.data as TableProps),
          style: s as TableProps["style"],
        });
      },
      [liveBlock, setData],
    );

    const updateProps = useCallback(
      (nextProps: TableProps["props"]) => {
        if (!liveBlock) return;
        setData({
          ...(liveBlock.data as TableProps),
          props: normalizeTableGridProps(nextProps),
        });
      },
      [liveBlock, setData],
    );

    const p = liveData.props ?? {
      rowCount: 3,
      colCount: 3,
      colspan: [],
      rowspan: [],
      cells: [],
    };

    const setDimensions = useCallback(
      (rowCount: number, colCount: number) => {
        const next = resizeTableDimensions(
          normalizeTableGridProps({
            rowCount: p.rowCount ?? 3,
            colCount: p.colCount ?? 3,
            cells: p.cells ?? [],
            colspan: p.colspan ?? [],
            rowspan: p.rowspan ?? [],
            colWidths: p.colWidths,
            rowHeights: p.rowHeights,
          }),
          rowCount,
          colCount,
          createEmptyTableCell,
        );
        updateProps({ ...p, ...next });
      },
      [p, updateProps],
    );

    const isTableSlot =
      !!selectedSlot && selectedSlot.slotKey.startsWith("cells.");

    return (
      <SlotOrBlockStylesPanel
        slotKeyPrefix="cells."
        selectedSlot={selectedSlot}
        availableStyles={styles}
        shortcuts={isTableSlot ? tableCellShortcuts : tableBlockShortcuts}
        blockStyles={liveData.style ?? {}}
        onBlockStylesChange={updateStyle}
        base={isTableSlot ? undefined : base}
        onBaseChange={isTableSlot ? undefined : onBaseChange}
      >
        {!isTableSlot ? (
          <>
            <SliderInput
              label={t("pageBuilder.blocks.table.rowCount")}
              defaultValue={p.rowCount ?? 3}
              onChange={(rowCount) => setDimensions(rowCount, p.colCount ?? 3)}
              iconLabel={<Rows3 className="size-4" />}
              units={t("pageBuilder.blocks.table.rowsUnit")}
              min={1}
              max={20}
              step={1}
            />
            <SliderInput
              label={t("pageBuilder.blocks.table.columnCount")}
              defaultValue={p.colCount ?? 3}
              onChange={(colCount) => setDimensions(p.rowCount ?? 3, colCount)}
              iconLabel={<Columns3 className="size-4" />}
              units={t("pageBuilder.blocks.table.columnsUnit")}
              min={1}
              max={12}
              step={1}
            />
          </>
        ) : null}
      </SlotOrBlockStylesPanel>
    );
  },
);
