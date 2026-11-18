"use client";

import {
  CommunicationBuilderAIProvider,
  type CommunicationBuilderAIAdapters,
} from "@hacado/ui-admin-kit/communications";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Thin dashboard-shell provider. Heavy email/RTE/Builder AI adapters live in a
 * separate module loaded only on the client so the layout import stays light.
 */
export function SendCommunicationBuilderAIProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [adapters, setAdapters] = useState<CommunicationBuilderAIAdapters>({});

  useEffect(() => {
    let cancelled = false;

    void import("./send-communication-ai-adapters").then((mod) => {
      if (!cancelled) setAdapters(mod.adapters);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <CommunicationBuilderAIProvider value={adapters}>
      {children}
    </CommunicationBuilderAIProvider>
  );
}
