"use client";

import { useRootModalBlocks } from "@hacado/builder/editor";

export type PageModalOption = {
  id: string;
  type: string;
  actionId: string;
  show?: string;
};

export function usePageModals(type?: string) {
  const modals = useRootModalBlocks(type);

  return modals as PageModalOption[];
}
