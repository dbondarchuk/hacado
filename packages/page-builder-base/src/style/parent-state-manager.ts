import {
  StateWithTarget,
  generateViewStateDataAttribute,
  isParentTarget,
  isSelectorTarget,
  isViewState,
} from "./zod";

/**
 * Manages parent state detection and sets data attributes on parent elements
 * to enable CSS selectors for parent states
 *
 * Updated to work with block classnames (starting with 'block-') and new view states
 */
export class ParentStateManager {
  private static instance: ParentStateManager;
  private elementHandlers: Map<string, Map<string, () => void>> = new Map();
  private intersectionObservers: Map<string, IntersectionObserver> = new Map();

  static getInstance(): ParentStateManager {
    if (!ParentStateManager.instance) {
      ParentStateManager.instance = new ParentStateManager();
    }
    return ParentStateManager.instance;
  }

  /**
   * Initialize parent state detection for an element
   */
  initializeElement(element: Element, states: StateWithTarget[]): void {
    const elementId = this.getElementId(element);

    // Clean up existing handlers
    this.cleanupElement(elementId);

    // Set up handlers for each parent state
    states.forEach((state) => {
      if (isParentTarget(state) || isViewState(state.state)) {
        this.setupParentStateHandler(element, state);
      }
    });
  }

  /**
   * Clean up handlers for an element
   */
  cleanupElement(elementId: string): void {
    const handlers = this.elementHandlers.get(elementId);
    if (handlers) {
      handlers.forEach((cleanup) => cleanup());
      this.elementHandlers.delete(elementId);
    }

    // Clean up intersection observers
    const observer = this.intersectionObservers.get(elementId);
    if (observer) {
      observer.disconnect();
      this.intersectionObservers.delete(elementId);
    }
  }

  /**
   * Set up handler for a specific parent state
   */
  private setupParentStateHandler(
    element: Element,
    state: StateWithTarget,
  ): void {
    const elementId = this.getElementId(element);

    // Handle different target types
    if (!isParentTarget(state) && !isViewState(state.state)) {
      return;
    }

    let observedElement: Element | null = null;
    let targetElement: Element = element;
    let targetLevel = 0;

    if (isParentTarget(state)) {
      targetLevel = state.target?.data?.level || 0;

      // Find the parent element at the specified level
      let currentElement: Element | null = element;
      let i = 0;
      while (i < targetLevel && currentElement) {
        currentElement = currentElement?.parentElement || null;
        if (
          Array.from(currentElement?.classList?.values() || []).some(
            (className) => className.startsWith("block-"),
          )
        ) {
          observedElement = currentElement;
          i++;
        }
      }
    } else if (isSelectorTarget(state)) {
      // For selector type, find the closest ancestor matching the selector

      const selectorElement = element.querySelector(state.target.data.selector);
      if (state.target.data.stateType === "block") {
        observedElement = element;
        targetElement = selectorElement || element;
      } else {
        observedElement = selectorElement || element;
        targetElement = selectorElement || element;
      }

      targetLevel = 0; // Use level 0 for selector type
    } else if (isViewState(state.state)) {
      // For view states, use the element itself as parent
      observedElement = element;
      targetLevel = 0;
    }

    if (!observedElement) return;

    if (isViewState(state.state)) {
      this.setupViewStateHandler(targetElement, observedElement, state);
      return;
    }

    // Set up event listeners on the parent element
    const cleanup = this.setupParentEventListeners(
      observedElement,
      targetElement,
      state,
    );

    // Store cleanup function
    if (!this.elementHandlers.has(elementId)) {
      this.elementHandlers.set(elementId, new Map());
    }
    this.elementHandlers
      .get(elementId)!
      .set(`${state.state}-${targetLevel}`, cleanup);
  }

  /**
   * Set up view state handler using Intersection Observer
   */
  private setupViewStateHandler(
    targetElement: Element,
    observedElement: Element,
    state: StateWithTarget,
  ): void {
    const elementId = this.getElementId(targetElement);
    const dataAttribute = generateViewStateDataAttribute(state);

    // Create intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (state.state === "inView") {
            if (entry.isIntersecting) {
              targetElement.setAttribute(dataAttribute!, "true");
            } else {
              targetElement.removeAttribute(dataAttribute!);
            }
          } else if (state.state === "notInView") {
            if (!entry.isIntersecting) {
              targetElement.setAttribute(dataAttribute!, "true");
            } else {
              targetElement.removeAttribute(dataAttribute!);
            }
          } else if (state.state === "firstTimeInView") {
            if (
              entry.isIntersecting &&
              !targetElement.hasAttribute(dataAttribute!)
            ) {
              targetElement.setAttribute(dataAttribute!, "true");
            }
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: "0px", // No margin
      },
    );

    observer.observe(observedElement);

    // Store observer for cleanup
    this.intersectionObservers.set(elementId, observer);
  }

  /**
   * Set up event listeners on parent element
   */
  private setupParentEventListeners(
    parentElement: Element,
    targetElement: Element,
    state: StateWithTarget,
  ): () => void {
    const dataAttribute = generateViewStateDataAttribute(state);

    // Set up event listeners based on state type
    const eventMap: Record<string, string[]> = {
      hover: ["mouseenter", "mouseleave"],
      focus: ["focusin", "focusout"],
      "focus-within": ["focusin", "focusout"],
      active: ["mousedown", "mouseup"],
      disabled: ["focusin", "focusout"], // For disabled state, we'll check the disabled attribute
      inView: [], // Handled by Intersection Observer
      notInView: [], // Handled by Intersection Observer
      firstTimeInView: [], // Handled by Intersection Observer
    };

    const events = eventMap[state.state];
    if (!events || events.length === 0) return () => {};

    const handlers: Array<{ event: string; handler: (event: Event) => void }> =
      [];

    events.forEach((eventType) => {
      const handler = (event: Event) => {
        this.handleParentStateEvent(
          event,
          parentElement,
          targetElement,
          state,
          dataAttribute!,
        );
      };

      parentElement.addEventListener(eventType, handler, true);
      handlers.push({ event: eventType, handler });
    });

    // Return cleanup function
    return () => {
      handlers.forEach(({ event, handler }) => {
        parentElement.removeEventListener(event, handler, true);
      });
      // Remove data attribute
      targetElement.removeAttribute(dataAttribute!);
    };
  }

  /**
   * Handle parent state events
   */
  private handleParentStateEvent(
    event: Event,
    parentElement: Element,
    targetElement: Element,
    state: StateWithTarget,
    dataAttribute: string,
  ): void {
    const isEntering =
      event.type.includes("enter") ||
      event.type === "focusin" ||
      event.type === "mousedown";

    if (isEntering) {
      targetElement.setAttribute(dataAttribute, "true");
    } else {
      targetElement.removeAttribute(dataAttribute);
    }
  }

  /**
   * Generate a unique ID for an element
   */
  private getElementId(element: Element): string {
    if (!element.hasAttribute("data-parent-state-id")) {
      const id = `parent-state-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      element.setAttribute("data-parent-state-id", id);
    }
    return element.getAttribute("data-parent-state-id")!;
  }

  /**
   * Clean up all handlers (call this when component unmounts)
   */
  cleanup(): void {
    this.elementHandlers.forEach((handlers) => {
      handlers.forEach((cleanup) => cleanup());
    });
    this.elementHandlers.clear();

    // Clean up all intersection observers
    this.intersectionObservers.forEach((observer) => {
      observer.disconnect();
    });
    this.intersectionObservers.clear();
  }
}

/**
 * Hook to use parent state manager in React components
 */
export function useParentStateManager() {
  const manager = ParentStateManager.getInstance();

  const initializeElement = (
    element: Element | null,
    states: StateWithTarget[],
  ) => {
    if (element && states.length > 0) {
      manager.initializeElement(element, states);
    }
  };

  const cleanupElement = (element: Element | null) => {
    if (element) {
      const elementId = element.getAttribute("data-parent-state-id");
      if (elementId) {
        manager.cleanupElement(elementId);
      }
    }
  };

  return { initializeElement, cleanupElement };
}
