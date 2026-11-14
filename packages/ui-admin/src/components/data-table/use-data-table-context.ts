import { create } from "zustand";

export type DataTableContextProps<T> = {
  rowSelection: T[];
  setRowSelection: (data: T[]) => void;
  /** Bumped when selection should be cleared in the table UI */
  selectionResetKey: number;
  clearRowSelection: () => void;
};

export const useSelectedRowsStore = create<DataTableContextProps<any>>(
  (set) => ({
    rowSelection: [],
    selectionResetKey: 0,
    setRowSelection: (data: any[]) => {
      return set(() => ({
        rowSelection: data,
      }));
    },
    clearRowSelection: () =>
      set((state) => ({
        rowSelection: [],
        selectionResetKey: state.selectionResetKey + 1,
      })),
  }),
);
