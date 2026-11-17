"use client";

import { useEffect } from "react";
import { useBuilderAIStore } from "./store";

/**
 * Keep Builder AI chat scoped to the current editor host.
 * Clears history when the host identity changes or the host unmounts
 * (e.g. new page → edit → new page again).
 */
export function useBuilderAIHostLifecycle(documentId?: string) {
  useEffect(() => {
    useBuilderAIStore.getState().resetConversation();

    return () => {
      useBuilderAIStore.getState().resetConversation();
    };
  }, [documentId]);
}
