"use client";
import {
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";
import {
  ColumnDef,
  ColumnSizingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { baseSearchParams } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { Sort } from "@timelish/types";
import {
  Button,
  cn,
  ScrollArea,
  ScrollBar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@timelish/ui";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelectedRowsStore } from "./use-data-table-context";

// function getSize(size = 100, max = Number.MAX_SAFE_INTEGER, min = 40) {
//   return Math.max(Math.min(size, max), min);
// }

// const calculateTableSizing = <DataType,>(
//   columns: Header<DataType, unknown>[],
//   totalWidth: number
// ): Record<string, number> => {
//   let totalAvailableWidth = totalWidth;
//   let totalIsGrow = 0;

//   columns.forEach((header) => {
//     const column = header.column.columnDef;
//     if (!column.size) {
//       if (column.meta?.dontGrow) {
//         let calculatedSize = 100;
//         if (column?.meta?.widthPercentage) {
//           calculatedSize = column.meta.widthPercentage * totalWidth * 0.01;
//         } else {
//           calculatedSize = totalWidth / columns.length;
//         }

//         const size = getSize(calculatedSize, column.maxSize, column.minSize);

//         column.size = size;
//       }
//     }

//     if (!column.meta?.dontGrow) totalIsGrow += 1;
//     else
//       totalAvailableWidth -= getSize(
//         column.size,
//         column.maxSize,
//         column.minSize
//       );
//   });

//   const sizing: Record<string, number> = {};

//   columns.forEach((header) => {
//     const column = header.column.columnDef;
//     if (!column.meta?.dontGrow) {
//       let calculatedSize = 100;
//       calculatedSize = Math.floor(totalAvailableWidth / totalIsGrow);
//       const size = getSize(calculatedSize, column.maxSize, column.minSize);
//       column.size = size;
//     }

//     sizing[`${column.id}`] = Number(column.size);
//   });

//   return sizing;
// };

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalItems: number;
  pageSizeOptions?: number[];
  sortSchemaDefault?: Sort;
  additionalCellProps?: Record<string, any>;
  className?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalItems,
  pageSizeOptions = [10, 20, 30, 40, 50],
  sortSchemaDefault,
  additionalCellProps,
  className,
}: DataTableProps<TData, TValue>) {
  const t = useI18n("ui");
  const [currentPage, setCurrentPage] = useQueryState(
    "page",
    parseAsInteger.withOptions({ shallow: false }).withDefault(1),
  );

  const [pageSize, setPageSize] = useQueryState(
    "limit",
    parseAsInteger
      .withOptions({ shallow: false, history: "push" })
      .withDefault(10),
  );

  const paginationState = {
    pageIndex: currentPage - 1, // zero-based index for React Table
    pageSize: pageSize,
  };

  const [sort, setSort] = useQueryState(
    "sort",
    baseSearchParams.sort
      .withOptions({ shallow: false, history: "push" })
      .withDefault(sortSchemaDefault || []),
  );
  const sortingState = sort || [];

  const pageCount = Math.ceil(totalItems / pageSize);

  const handlePaginationChange = (
    updaterOrValue:
      | PaginationState
      | ((old: PaginationState) => PaginationState),
  ) => {
    const pagination =
      typeof updaterOrValue === "function"
        ? updaterOrValue(paginationState)
        : updaterOrValue;

    setCurrentPage(pagination.pageIndex + 1); // converting zero-based index to one-based
    setPageSize(pagination.pageSize);
  };

  const handleSortingChange = (
    updaterOrValue: SortingState | ((old: SortingState) => SortingState),
  ) => {
    const sorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sortingState)
        : updaterOrValue;

    setCurrentPage(1); // converting zero-based index to one-based
    setSort(sorting);
  };

  const { setRowSelection } = useSelectedRowsStore((state) => state);
  const [colSizing, setColSizing] = useState<ColumnSizingState>({});

  const table = useReactTable({
    data,
    columns: columns,
    pageCount: pageCount,
    // enableColumnResizing: true,
    // columnResizeMode: "onChange",
    state: {
      pagination: paginationState,
      sorting: sortingState,
      columnSizing: colSizing,
    },
    onPaginationChange: handlePaginationChange,
    onSortingChange: handleSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // onColumnSizingChange: setColSizing,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
  });

  const selected = table.getSelectedRowModel().flatRows;
  const selectedRows = useMemo(
    () => selected.map((row) => row.original),
    [selected],
  );

  useEffect(() => {
    setRowSelection(selectedRows);
  }, [selectedRows]);

  const tableContainerRef = useRef<HTMLDivElement>(null);
  // const windowDimensions = useWindowSize();
  // const headers = table.getFlatHeaders();
  // useLayoutEffect(() => {
  //   if (tableContainerRef.current) {
  //     const initialColumnSizing = calculateTableSizing(
  //       headers,
  //       tableContainerRef.current?.clientWidth
  //     );

  //     table.setColumnSizing(initialColumnSizing);
  //   }

  //   // Use Dependencies to trigger a reset in column widths
  // }, [headers, windowDimensions.width]);

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <div className="relative flex flex-1" ref={tableContainerRef}>
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 top-0 flex overflow-scroll rounded-md border md:overflow-auto",
            className,
          )}
        >
          <ScrollArea className="flex-1">
            <Table
            //  style={{ width: table.getTotalSize() }}
            >
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="relative group/thead"
                        // style={{
                        //   width: header.getSize(),
                        // }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        {/* <ColumnResizer header={header} /> */}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            cell.column.getIsResizing() &&
                              "border-r border-dashed",
                          )}
                          // style={{
                          //   width: cell.column.getSize(),
                          //   minWidth: cell.column.columnDef.minSize,
                          // }}
                        >
                          {flexRender(cell.column.columnDef.cell, {
                            ...cell.getContext(),
                            ...(additionalCellProps ?? {}),
                          })}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      {t("common.noResults")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      <div className="flex flex-col items-center justify-end gap-2 space-x-2 py-2 sm:flex-row">
        <div className="flex w-full items-center justify-between">
          <div className="flex-1 text-sm text-muted-foreground">
            {totalItems > 0
              ? t("dataTable.showingEntries", {
                  start:
                    paginationState.pageIndex * paginationState.pageSize + 1,
                  end: Math.min(
                    (paginationState.pageIndex + 1) * paginationState.pageSize,
                    totalItems,
                  ),
                  total: totalItems,
                })
              : t("dataTable.noEntriesFound")}
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
            <div className="flex items-center space-x-2">
              <p className="whitespace-nowrap text-sm font-medium">
                {t("dataTable.rowsPerPage")}
              </p>
              <Select
                value={`${paginationState.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-8 w-[80px]">
                  <SelectValue placeholder={paginationState.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="flex w-full items-center justify-between gap-2 sm:justify-end">
          <div className="flex w-[150px] items-center justify-center text-sm font-medium">
            {totalItems > 0
              ? t("dataTable.pageOf", {
                  page: paginationState.pageIndex + 1,
                  totalPages: table.getPageCount(),
                })
              : t("dataTable.noPages")}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              aria-label={t("dataTable.goToFirstPage")}
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <DoubleArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label={t("dataTable.goToPreviousPage")}
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label={t("dataTable.goToNextPage")}
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              aria-label={t("dataTable.goToLastPage")}
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <DoubleArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
