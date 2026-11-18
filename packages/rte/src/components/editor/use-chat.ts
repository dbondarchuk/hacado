"use client";

import { useChat as useBaseChat } from "ai/react";

/**
 * Plate AI chat for the rich text editor.
 * Auth and model selection happen on the server (`/api/ai/command`).
 * Do not send API keys from the browser.
 */
export const useChat = () => {
  return useBaseChat({
    id: "editor",
    api: "/api/ai/command",
  });
};
