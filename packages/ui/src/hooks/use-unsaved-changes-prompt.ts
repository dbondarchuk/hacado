"use client";

import { useEffect, useRef } from "react";
import { UseFormReturn } from "react-hook-form";

/**
 * A hook that shows a browser prompt when users try to leave the page with unsaved changes.
 *
 * @param form - The react-hook-form instance to monitor for changes
 * @param enabled - Whether the prompt should be enabled (default: true)
 * @param message - Custom message to show in the prompt (optional)
 */
export const useUnsavedChangesPrompt = (
  form: UseFormReturn<any>,
  enabled: boolean = true,
  message?: string,
) => {
  const { isDirty } = form.formState;
  const hasUnsavedChangesRef = useRef(false);

  // Update the ref when form dirty state changes
  useEffect(() => {
    hasUnsavedChangesRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        const defaultMessage =
          "You have unsaved changes. Are you sure you want to leave?";

        event.preventDefault();
        event.returnValue = "";
        return message || defaultMessage;
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      if (hasUnsavedChangesRef.current) {
        const defaultMessage =
          "You have unsaved changes. Are you sure you want to leave?";

        const userWantsToLeave = window.confirm(message || defaultMessage);

        if (!userWantsToLeave) {
          // Prevent navigation by pushing the current state back
          window.history.pushState(null, "", window.location.href);
        }
      }
    };

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [enabled, message]);

  return {
    hasUnsavedChanges: isDirty,
  };
};
