export type DndContext = {
  parentBlockId: string;
  parentProperty: string;
  index: number;
  type: string;
  /**
   * When true, `index` is already the insertion index. Do not apply the
   * before/after collision modifier used for block sortables.
   */
  isInsertSlot?: boolean;
};
