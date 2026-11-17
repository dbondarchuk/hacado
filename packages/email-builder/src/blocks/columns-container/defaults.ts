import type { ColumnsContainerProps } from "./schema";

export const ColumnsContainerPropsDefaults = {
  props: {
    contentAlignment: "middle",
    columnsCount: 3,
    columnsGap: 16,
    columns: [{ children: [] }, { children: [] }, { children: [] }],
  },
  style: { padding: { top: 16, bottom: 16, left: 24, right: 24 } },
} as const satisfies ColumnsContainerProps;
