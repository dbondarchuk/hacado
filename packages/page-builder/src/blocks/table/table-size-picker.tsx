"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ToolbarButton,
} from "@hacado/ui";
import { Grid3x3 } from "lucide-react";
import { useCallback, useState } from "react";

const GRID_SIZE = 8;

type TableSizePickerProps = {
  rowCount: number;
  colCount: number;
  onSelect: (rowCount: number, colCount: number) => void;
};

export const TableSizePicker = ({
  rowCount,
  colCount,
  onSelect,
}: TableSizePickerProps) => {
  const t = useI18n("builder");
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState({ rowCount, colCount });

  const grid = Array.from({ length: GRID_SIZE }, (_, rowIndex) =>
    Array.from({ length: GRID_SIZE }, (_, colIndex) =>
      rowIndex <= hover.rowCount - 1 && colIndex <= hover.colCount - 1 ? 1 : 0,
    ),
  );

  const onCellMove = useCallback((rowIndex: number, colIndex: number) => {
    setHover({ rowCount: rowIndex + 1, colCount: colIndex + 1 });
  }, []);

  const applySize = useCallback(() => {
    onSelect(hover.rowCount, hover.colCount);
    setOpen(false);
  }, [hover.colCount, hover.rowCount, onSelect]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setHover({ rowCount, colCount });
        }
      }}
    >
      <PopoverTrigger asChild>
        <ToolbarButton
          pressed={open}
          tooltip={t("pageBuilder.blocks.table.sizePicker.tooltip")}
        >
          <Grid3x3 className="size-4" />
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <button type="button" className="flex flex-col" onClick={applySize}>
          <TableSizeGrid grid={grid} onCellMove={onCellMove} />
          <div className="border-t px-2 py-1.5 text-center text-xs text-muted-foreground">
            {t("pageBuilder.blocks.table.sizePicker.dimensions", {
              rowCount: hover.rowCount,
              colCount: hover.colCount,
            })}
          </div>
        </button>
      </PopoverContent>
    </Popover>
  );
};

function TableSizeGrid({
  grid,
  onCellMove,
}: {
  grid: number[][];
  onCellMove: (rowIndex: number, colIndex: number) => void;
}) {
  return (
    <div className="grid size-[130px] grid-cols-8 gap-0.5 p-1">
      {grid.map((rows, rowIndex) =>
        rows.map((value, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={cn(
              "col-span-1 size-3 border border-solid bg-secondary",
              value ? "border-current" : "",
            )}
            onMouseEnter={() => onCellMove(rowIndex, colIndex)}
          />
        )),
      )}
    </div>
  );
}
