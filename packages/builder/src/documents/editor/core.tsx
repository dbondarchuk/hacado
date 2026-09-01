import { BaseBlockProps } from "../types";

export type BlockDisableOptions = {
  drag?: boolean;
  delete?: boolean;
  move?: boolean;
  clone?: boolean;
  /** When true, hide the selected-block overlay resize handles. */
  resize?: boolean;
  /** When true, hide the selected-block overlay (NavMenu, border, handles). */
  overlay?: boolean;
  /** When true, hide only the NavMenu on the selected-block overlay. */
  navMenu?: boolean;
};

export type TEditorBlock<T = any> = {
  type: string;
  data: T;
  id: string;
  base?: BaseBlockProps;
  metadata?: Record<string, any>;
};

export type TEditorConfiguration = TEditorBlock;
