"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

export const IS_CLIPBOARD_PASTE_SUPPORTED = false;

export function useClipboard(document?: Document, pollInterval = 1000) {
  const [clipboardText, setClipboardText] = useState<string>("");

  const isFirefox = useMemo(() => {
    return navigator.userAgent?.toLocaleLowerCase().includes("firefox");
  }, []);

  const navigatorToUse = useMemo(
    () => document?.defaultView?.navigator || navigator,
    [document],
  );

  const readClipboard = useCallback(async () => {
    try {
      // Firefox shows a popup when reading the clipboard
      if (isFirefox) {
        return false;
      }

      // Clipboard paste might not be supported in some browsers
      if (!IS_CLIPBOARD_PASTE_SUPPORTED) {
        return false;
      }

      const text = await navigatorToUse?.clipboard.readText();
      setClipboardText(text);
      return text;
    } catch (err) {
      // console.error("Failed to read clipboard: ", err);
      return false;
    }
  }, [navigatorToUse, isFirefox]);

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await navigatorToUse?.clipboard.writeText(text);
        setClipboardText(text);
        return true;
      } catch (err) {
        // console.error("Failed to copy to clipboard: ", err);
        return false;
      }
    },
    [navigatorToUse],
  );

  useEffect(() => {
    // Poll the clipboard every X ms
    const interval = setInterval(() => {
      readClipboard();
    }, pollInterval);

    // Also update on paste events
    const handlePaste = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData("text");
      if (text) {
        setClipboardText(text);
      }
    };

    window.addEventListener("paste", handlePaste);

    return () => {
      clearInterval(interval);
      window.removeEventListener("paste", handlePaste);
    };
  }, [pollInterval, readClipboard, navigatorToUse]);

  const isPasteSupported = useMemo(() => {
    return IS_CLIPBOARD_PASTE_SUPPORTED;
  }, []);

  return { clipboardText, readClipboard, copyToClipboard, isPasteSupported };
}
