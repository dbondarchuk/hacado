"use client";

import { usePortalContext } from "@hacado/builder";
import React, { useEffect } from "react";
import { useParentStateManager } from "../style/parent-state-manager";
import { StateWithTarget } from "../style/zod";

interface StateManagerProps {
  className: string;
  states: StateWithTarget[];
}

/**
 * StateManager component that handles parent state detection and data attribute management
 *
 * Usage:
 * <StateManager className="my-block" states={[{ state: "hover", stateTarget: { type: "parent", data: { level: 1 } } }]}>
 *   <div className="my-block">Content</div>
 * </StateManager>
 */
export const StateManager: React.FC<StateManagerProps> = ({
  className,
  states,
}) => {
  const { initializeElement, cleanupElement } = useParentStateManager();
  const { document } = usePortalContext();

  // Initialize parent state management when component mounts or states change
  useEffect(() => {
    if (states.length > 0) {
      // Find the element by className
      const element = document.querySelector(`.${className}`);
      if (element) {
        initializeElement(element, states);
      }
    }

    // Cleanup when component unmounts or states change
    return () => {
      const element = document.querySelector(`.${className}`);
      if (element) {
        cleanupElement(element);
      }
    };
  }, [className, states, document, initializeElement, cleanupElement]);

  return null;
};
