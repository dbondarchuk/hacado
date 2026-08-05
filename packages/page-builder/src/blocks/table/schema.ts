import type { TEditorBlock } from "@hacado/builder";
import {
  BaseReaderBlockProps,
  coerceArray,
  generateId,
} from "@hacado/builder";
import type { I18nFn } from "@hacado/i18n";
import {
  createEmptySlot,
  embeddedSlotSchema,
  migrateContainerSlot,
  type EmbeddedSlotData,
} from "@hacado/page-builder-base/slots";
import { Prettify } from "@hacado/types";
import * as z from "zod";
import { equalColWidthPercents } from "./grid-utils";
import { zStyles } from "./styles";

const zEmbeddedCell = embeddedSlotSchema(zStyles);

const defaultTableCellStyle = {
  padding: [
    {
      value: {
        top: { value: 0.5, unit: "rem" },
        bottom: { value: 0.5, unit: "rem" },
        left: { value: 0.5, unit: "rem" },
        right: { value: 0.5, unit: "rem" },
      },
    },
  ],
  textAlign: [{ value: "center" }],
  alignContent: [{ value: "center" }],
} as const;

export function createEmptyTableCell(): EmbeddedSlotData {
  return createEmptySlot({ ...defaultTableCellStyle });
}

/** First-row header cell with muted background and a column label. */
export function createHeaderTableCell(columnNumber: number): EmbeddedSlotData {
  return createEmptySlot(
    {
      ...defaultTableCellStyle,
      backgroundColor: [{ value: "var(--value-muted-color)" }],
    },
    [
      {
        type: "InlineText",
        id: generateId(),
        data: {
          props: { text: `Heading ${columnNumber}` },
          style: {
            fontWeight: [{ value: "600" }],
          },
        },
      },
    ],
  );
}

/** @deprecated Use createEmptyTableCell - migrates legacy Container cells. */
export function createTableCellBlock(): TEditorBlock {
  return {
    type: "Container",
    id: generateId(),
    data: {
      style: createEmptyTableCell().style,
      props: { children: [] },
    },
  };
}

function normalizeTableProps(props: Record<string, unknown>) {
  let next = props;
  if (Array.isArray(props.cellBlocks)) {
    const cells = (props.cellBlocks as TEditorBlock[]).map(
      migrateContainerSlot,
    );
    const { cellBlocks: _removed, ...rest } = props;
    next = { ...rest, cells };
  }
  const cells = coerceArray<unknown>(next.cells);
  if (cells.length > 0 || next.cells !== undefined) {
    return {
      ...next,
      cells: cells.map((cell) => {
        if (cell && typeof cell === "object" && "type" in cell) {
          return migrateContainerSlot(cell as TEditorBlock);
        }
        return cell;
      }),
      colspan: coerceArray<number>(next.colspan),
      rowspan: coerceArray<number>(next.rowspan),
    };
  }
  return next;
}

export const TablePropsSchema = z.object({
  style: zStyles,
  props: z.preprocess(
    (val) =>
      val && typeof val === "object"
        ? normalizeTableProps(val as Record<string, unknown>)
        : val,
    z.object({
      rowCount: z.coerce.number().int().min(1).max(30),
      colCount: z.coerce.number().int().min(1).max(30),
      colspan: z.array(z.coerce.number().int().min(1).max(30)),
      rowspan: z.array(z.coerce.number().int().min(1).max(30)),
      cells: z.array(zEmbeddedCell),
      colWidths: z.array(z.coerce.number().min(1).max(100)).optional(),
      rowHeights: z.array(z.coerce.number().min(32).max(1200)).optional(),
    }),
  ),
});

export type TableProps = Prettify<z.infer<typeof TablePropsSchema>>;
export type TableReaderProps = BaseReaderBlockProps<any> & TableProps;

export const TablePropsDefaults = (
  _t: I18nFn<undefined, undefined>,
): TableProps => {
  const rowCount = 3;
  const colCount = 3;
  const n = rowCount * colCount;
  return {
    style: {},
    props: {
      rowCount,
      colCount,
      colspan: Array.from({ length: n }, () => 1),
      rowspan: Array.from({ length: n }, () => 1),
      cells: Array.from({ length: n }, (_, flat) => {
        const col = flat % colCount;
        const row = Math.floor(flat / colCount);
        return row === 0
          ? createHeaderTableCell(col + 1)
          : createEmptyTableCell();
      }),
      colWidths: equalColWidthPercents(colCount),
      rowHeights: Array.from({ length: rowCount }, () => 72),
    },
  };
};
