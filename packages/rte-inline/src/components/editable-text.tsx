"use client";

import { cn, mergeRefs, useDebounceCallback } from "@hacado/ui";
import type React from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { RTEProvider, useRTEContext } from "../context/rte-context";
import type {
  DisabledFeatures,
  RichTextValue,
  TextMark,
  VariableData,
} from "../lib/rich-text-types";
import {
  getSelectionPositions,
  htmlToRichText,
  normalizeRichText,
  stringToRichText,
} from "../lib/rich-text-utils";
import { pluginRegistry } from "../plugins";
import { richTextToHtml } from "../styles/apply-text-styles";
import { FloatingToolbar } from "./floating-toolbar";
import { VariableAutocomplete } from "./variable-autocomplete";

interface EditableTextProps {
  value: RichTextValue | string;
  onChange: (value: RichTextValue) => void;
  placeholder?: string;
  className?: string;
  inline?: boolean;
  variables?: VariableData;
  disabledFeatures?: DisabledFeatures;
  id?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  documentElement?: Document;
  portalContainer?: string;
  disabled?: boolean;
}

// Inner component that uses the context
const EditableTextInner = forwardRef<
  HTMLDivElement,
  Omit<EditableTextProps, "value" | "onChange"> & {
    richTextValue: RichTextValue;
    popoverRefs: React.RefObject<Set<HTMLElement>>;
  }
>(
  (
    {
      placeholder = "Type something...",
      className = "",
      inline = false,
      variables,
      id,
      onClick,
      disabledFeatures = [],
      documentElement = document,
      portalContainer = "body",
      richTextValue,
      popoverRefs,
      disabled = false,
    },
    ref,
  ) => {
    const rteContext = useRTEContext();
    const defaultView = documentElement.defaultView ?? window;
    const editorRef = rteContext.editorRef;
    const toolbarRef = useRef<HTMLDivElement>(null);
    const autocompleteRef = useRef<HTMLDivElement>(null);
    const savedSelectionRef = useRef<{ start: number; end: number } | null>(
      null,
    );
    const [showToolbar, setShowToolbar] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
    const [activeMarks, setActiveMarks] = useState<{
      marks: Partial<TextMark>;
      hasMixed: Set<keyof TextMark>;
    }>({
      marks: {},
      hasMixed: new Set(),
    });
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [autocompletePosition, setAutocompletePosition] = useState({
      top: 0,
      left: 0,
    });
    const [variableQuery, setVariableQuery] = useState("");

    const renderToHTML = useCallback(
      (blocks: RichTextValue): string => {
        return richTextToHtml(blocks, inline);
        // if (disableNewlines) {
        //   return blocks
        //     .map((block) =>
        //       block.content
        //         .map((node) => {
        //           const styles = applyTextStyles(node);
        //           let content: string = node.text;
        //           let styleStr = "";

        //           if (Object.keys(styles).length > 0) {
        //             styleStr = Object.entries(styles)
        //               .map(([key, val]) => {
        //                 const cssKey = key
        //                   .replace(/([A-Z])/g, "-$1")
        //                   .toLowerCase();
        //                 return `${cssKey}:${val}`;
        //               })
        //               .join(";");
        //           }

        //           if (node.marks) {
        //             if (node.marks.superscript)
        //               content = `<sup style="${styleStr}">${content}</sup>`;
        //             else if (node.marks.subscript)
        //               content = `<sub style="${styleStr}">${content}</sub>`;
        //             else if (node.marks.bold && !node.marks.fontWeight)
        //               content = `<strong style="${styleStr}">${content}</strong>`;
        //             else if (styleStr)
        //               content = `<span style="${styleStr}">${content}</span>`;

        //             if (node.marks.italic) content = `<em>${content}</em>`;
        //             if (node.marks.underline) content = `<u>${content}</u>`;
        //             if (node.marks.strikethrough) content = `<s>${content}</s>`;
        //           } else if (styleStr) {
        //             content = `<span style="${styleStr}">${content}</span>`;
        //           }

        //           return content;
        //         })
        //         .join("")
        //     )
        //     .join(" ");
        // }

        // return blocks
        //   .map((block) => {
        //     const content = block.content
        //       .map((node) => {
        //         const styles = applyTextStyles(node);
        //         let content: string = node.text || "<br>";
        //         let styleStr = "";

        //         if (Object.keys(styles).length > 0) {
        //           styleStr = Object.entries(styles)
        //             .map(([key, val]) => {
        //               const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
        //               return `${cssKey}:${val}`;
        //             })
        //             .join(";");
        //         }

        //         if (node.marks) {
        //           if (node.marks.superscript)
        //             content = `<sup style="${styleStr}">${content}</sup>`;
        //           else if (node.marks.subscript)
        //             content = `<sub style="${styleStr}">${content}</sub>`;
        //           else if (node.marks.bold && !node.marks.fontWeight)
        //             content = `<strong style="${styleStr}">${content}</strong>`;
        //           else if (styleStr)
        //             content = `<span style="${styleStr}">${content}</span>`;

        //           if (node.marks.italic) content = `<em>${content}</em>`;
        //           if (node.marks.underline) content = `<u>${content}</u>`;
        //           if (node.marks.strikethrough) content = `<s>${content}</s>`;
        //         } else if (styleStr) {
        //           content = `<span style="${styleStr}">${content}</span>`;
        //         }

        //         return content;
        //       })
        //       .join("");

        //     return `<div>${content || "<br>"}</div>`;
        //   })
        //   .join("");
      },
      [inline],
    );

    const getTextOffset = useCallback(
      (root: Node, node: Node, offset: number): number => {
        let pos = 0;
        const walker = documentElement.createTreeWalker(
          root,
          NodeFilter.SHOW_TEXT,
        );

        let currentNode = walker.nextNode();
        while (currentNode) {
          if (currentNode === node) {
            return pos + offset;
          }
          pos += currentNode.textContent?.length || 0;
          currentNode = walker.nextNode();
        }

        return pos;
      },
      [documentElement],
    );

    const setRangeFromOffset = useCallback(
      (root: Node, range: Range, start: number, end: number) => {
        let pos = 0;
        const walker = documentElement.createTreeWalker(
          root,
          NodeFilter.SHOW_TEXT,
        );
        let startSet = false;
        let endSet = false;

        let currentNode = walker.nextNode();
        while (currentNode && !endSet) {
          const nodeLength = currentNode.textContent?.length || 0;

          if (!startSet && pos + nodeLength >= start) {
            range.setStart(currentNode, Math.min(start - pos, nodeLength));
            startSet = true;
          }

          if (startSet && pos + nodeLength >= end) {
            range.setEnd(currentNode, Math.min(end - pos, nodeLength));
            endSet = true;
          }

          pos += nodeLength;
          currentNode = walker.nextNode();
        }
      },
      [documentElement],
    );

    const isUpdatingRef = useRef(false);

    useEffect(() => {
      if (!editorRef.current || isUpdatingRef.current) return;

      const expectedHTML = renderToHTML(richTextValue);
      const currentHTML = editorRef.current.innerHTML;

      if (currentHTML === expectedHTML) return;

      const selection = defaultView.getSelection();
      let savedRange: { start: number; end: number } | null = null;

      if (
        selection &&
        selection.rangeCount > 0 &&
        editorRef.current.contains(selection.anchorNode)
      ) {
        const range = selection.getRangeAt(0);
        savedRange = {
          start: getTextOffset(
            editorRef.current,
            range.startContainer,
            range.startOffset,
          ),
          end: getTextOffset(
            editorRef.current,
            range.endContainer,
            range.endOffset,
          ),
        };
      }

      isUpdatingRef.current = true;
      editorRef.current.innerHTML = expectedHTML;
      isUpdatingRef.current = false;

      if (savedRange && editorRef.current.firstChild) {
        try {
          const newRange = documentElement.createRange();
          const sel = defaultView.getSelection();
          setRangeFromOffset(
            editorRef.current,
            newRange,
            savedRange.start,
            savedRange.end,
          );
          sel?.removeAllRanges();
          sel?.addRange(newRange);
        } catch (e) {
          // Ignore cursor restoration errors
        }
      }
    }, [
      richTextValue,
      renderToHTML,
      getTextOffset,
      setRangeFromOffset,
      editorRef,
      defaultView,
      documentElement,
    ]);

    const parseHTMLToRichText = useCallback(
      (html: string): RichTextValue => {
        return htmlToRichText(html, defaultView);
      },
      [defaultView],
    );

    const handleInput = useCallback(() => {
      if (!editorRef.current || isUpdatingRef.current) return;

      const html = editorRef.current.innerHTML;

      const newValue = parseHTMLToRichText(html);
      const normalized = normalizeRichText(newValue);

      rteContext.onChange(normalized);

      setTimeout(() => detectVariableInput(), 0);
    }, [rteContext, parseHTMLToRichText]);

    const detectVariableInput = useCallback(() => {
      if (!variables || !editorRef.current) return;

      const selection = defaultView.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const textBefore =
        range.startContainer.textContent?.slice(0, range.startOffset) || "";
      const lastOpenBrace = textBefore.lastIndexOf("{{");

      if (lastOpenBrace === -1) {
        setShowAutocomplete(false);
        return;
      }

      const textAfterBrace = textBefore.slice(lastOpenBrace + 2);
      const hasCloseBrace = textAfterBrace.includes("}}");

      if (!hasCloseBrace) {
        setVariableQuery(textAfterBrace);
        setShowAutocomplete(true);

        const rect = range.getBoundingClientRect();

        setAutocompletePosition({
          top: rect.bottom + defaultView.scrollY + 4,
          left: rect.left + defaultView.scrollX,
        });
      } else {
        setShowAutocomplete(false);
      }
    }, [variables]);

    const handleVariableSelect = useCallback(
      (variable: string) => {
        if (!editorRef.current) return;

        const selection = defaultView.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const textContent = editorRef.current.textContent || "";
        const range = selection.getRangeAt(0);
        const cursorPos = getTextOffset(
          editorRef.current,
          range.startContainer,
          range.startOffset,
        );

        const textBefore = textContent.slice(0, cursorPos);
        const lastOpenBrace = textBefore.lastIndexOf("{{");

        if (lastOpenBrace === -1) return;

        const beforeBrace = textContent.slice(0, lastOpenBrace);
        const afterCursor = textContent.slice(cursorPos);
        const newText = `${beforeBrace}{{${variable}}}${afterCursor}`;

        editorRef.current.textContent = newText;
        handleInput();

        const newCursorPos = lastOpenBrace + variable.length + 4;
        setTimeout(() => {
          const textNode = editorRef.current?.firstChild;
          if (textNode) {
            const newRange = documentElement.createRange();
            const sel = defaultView.getSelection();
            newRange.setStart(
              textNode,
              Math.min(newCursorPos, (textNode.textContent || "").length),
            );
            newRange.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(newRange);
          }
        }, 0);

        setShowAutocomplete(false);
      },
      [handleInput],
    );

    const handleSelectionChange = useCallback(() => {
      if (!editorRef.current?.contains(documentElement.activeElement)) return;

      const selection = defaultView.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setShowToolbar(false);
        return;
      }

      const range = selection.getRangeAt(0);
      if (range.collapsed) {
        setShowToolbar(false);
        return;
      }

      const { startPos, endPos } = getSelectionPositions(
        editorRef.current,
        richTextValue,
        defaultView,
      );

      if (startPos.blockIndex === -1 || endPos.blockIndex === -1) {
        setShowToolbar(false);
        return;
      }

      const marksInfo = rteContext.getActiveMarks();
      setActiveMarks(marksInfo);
      rteContext.saveSelection();
      setShowToolbar(true);

      const rect = range.getBoundingClientRect();
      setToolbarPosition({
        top: rect.top + defaultView.scrollY - 50,
        left: rect.left + defaultView.scrollX + rect.width / 2,
      });
    }, [
      richTextValue,
      rteContext,
      defaultView,
      getSelectionPositions,
      editorRef,
      documentElement,
    ]);

    useEffect(() => {
      documentElement.addEventListener(
        "selectionchange",
        handleSelectionChange,
      );

      return () => {
        documentElement.removeEventListener(
          "selectionchange",
          handleSelectionChange,
        );
      };
    }, [handleSelectionChange, defaultView, rteContext]);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;

        // Check if click is inside any registered popover
        let isInsidePopover = false;
        popoverRefs.current?.forEach((popoverEl) => {
          if (popoverEl.contains(target)) {
            isInsidePopover = true;
            e.stopPropagation();
          }
        });

        if (
          editorRef.current &&
          !editorRef.current.contains(target) &&
          toolbarRef.current &&
          !toolbarRef.current.contains(target) &&
          !isInsidePopover &&
          (!autocompleteRef.current ||
            !autocompleteRef.current.contains(target))
        ) {
          setShowToolbar(false);
          setShowAutocomplete(false);
        }
      };

      documentElement.addEventListener("mousedown", handleClickOutside);
      return () =>
        documentElement.removeEventListener("mousedown", handleClickOutside);
    }, [popoverRefs, editorRef, toolbarRef, autocompleteRef, documentElement]);

    const handleFormat = useCallback(
      async (
        type: keyof TextMark,
        value?: string | number | boolean | "inherit",
      ) => {
        await rteContext.restoreSelection();
        rteContext.applyFormat(type, value);
      },
      [rteContext],
    );

    const handleUndo = useCallback(() => {
      rteContext.undo();
    }, [rteContext]);

    const handleRedo = useCallback(() => {
      rteContext.redo();
    }, [rteContext]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (inline && e.key === "Enter") {
          e.preventDefault();
          return;
        }

        if ((e.metaKey || e.ctrlKey) && !e.altKey) {
          if (e.shiftKey && e.key.toLowerCase() === "z") {
            e.preventDefault();
            handleRedo();
            return;
          }

          if (e.key.toLowerCase() === "z") {
            e.preventDefault();
            handleUndo();
            return;
          }

          // Check plugins for keyboard shortcuts
          const plugins = pluginRegistry.getAll();
          for (const plugin of plugins) {
            if (plugin.keyboardShortcut) {
              const shortcut = plugin.keyboardShortcut;
              const keyMatch =
                e.key.toLowerCase() === shortcut.key.toLowerCase();
              const metaMatch =
                shortcut.metaKey === undefined ||
                (shortcut.metaKey && (e.metaKey || e.ctrlKey));
              const ctrlMatch =
                shortcut.ctrlKey === undefined ||
                (shortcut.ctrlKey && (e.metaKey || e.ctrlKey));
              const shiftMatch =
                shortcut.shiftKey === undefined ||
                (shortcut.shiftKey && e.shiftKey);
              const altMatch =
                shortcut.altKey === undefined || (shortcut.altKey && e.altKey);

              if (
                keyMatch &&
                metaMatch &&
                ctrlMatch &&
                shiftMatch &&
                altMatch
              ) {
                e.preventDefault();
                if (plugin.apply) {
                  plugin.apply(rteContext);
                } else {
                  handleFormat(plugin.name);
                }
                return;
              }
            }
          }
        }
      },
      [inline, handleUndo, handleRedo, handleFormat, rteContext],
    );

    const handlePaste = useCallback(
      (e: React.ClipboardEvent) => {
        e.preventDefault();
        const html = e.clipboardData.getData("text/html");
        const text = e.clipboardData.getData("text/plain");

        if (html) {
          const parsed = parseHTMLToRichText(html);
          const selection = defaultView.getSelection();
          if (selection && selection.rangeCount > 0 && editorRef.current) {
            const range = selection.getRangeAt(0);
            range.deleteContents();

            const fragment = documentElement.createDocumentFragment();
            const div = documentElement.createElement("div");
            div.innerHTML = renderToHTML(parsed);
            while (div.firstChild) {
              fragment.appendChild(div.firstChild);
            }
            range.insertNode(fragment);

            handleInput();
          }
        } else if (text) {
          documentElement.execCommand("insertText", false, text);
        }
      },
      [parseHTMLToRichText, renderToHTML, handleInput],
    );

    const Component = inline ? "span" : "div";

    useEffect(() => {
      if (!editorRef.current || !savedSelectionRef.current) return;

      const renderSelectionHighlight = () => {
        // Remove existing highlights
        editorRef.current
          ?.querySelectorAll(".custom-selection-highlight")
          .forEach((el) => el.remove());

        // Only show custom highlight if popovers have focus
        if (
          documentElement.activeElement &&
          !(
            popoverRefs.current &&
            popoverRefs.current.size > 0 &&
            Array.from(popoverRefs.current).some((el) =>
              el.contains(documentElement.activeElement),
            )
          )
        )
          return;

        const selection = savedSelectionRef.current;
        if (!selection || !editorRef.current) return;

        const newRange = documentElement.createRange();
        setRangeFromOffset(
          editorRef.current,
          newRange,
          selection.start,
          selection.end,
        );

        const rects = newRange.getClientRects();

        Array.from(rects).forEach((rect) => {
          const highlight = documentElement.createElement("div");
          highlight.className = "custom-selection-highlight";
          highlight.style.cssText = `
          position: absolute;
          background-color: rgb(59 130 246 / 0.1);
          pointer-events: none;
          z-index: 1;
          top: ${rect.top + defaultView.scrollY}px;
          left: ${rect.left + defaultView.scrollX}px;
          width: ${rect.width}px;
          height: ${rect.height}px;
        `;
          documentElement.body.appendChild(highlight);
        });
      };

      renderSelectionHighlight();

      // Re-render on scroll or resize
      const handleUpdate = () => renderSelectionHighlight();
      defaultView.addEventListener("scroll", handleUpdate, true);
      defaultView.addEventListener("resize", handleUpdate);
      defaultView.addEventListener("focusin", handleUpdate);

      return () => {
        editorRef.current
          ?.querySelectorAll(".custom-selection-highlight")
          .forEach((el) => el.remove());
        documentElement.body
          .querySelectorAll(".custom-selection-highlight")
          .forEach((el) => el.remove());
        defaultView.removeEventListener("scroll", handleUpdate, true);
        defaultView.removeEventListener("resize", handleUpdate);
        defaultView.removeEventListener("focusin", handleUpdate);
      };
    }, [showToolbar, savedSelectionRef.current]);

    const portalContainerElement = useMemo(() => {
      if (portalContainer === "body") {
        return documentElement.body;
      }

      return (
        documentElement.querySelector(portalContainer) ?? documentElement.body
      );
    }, [portalContainer, documentElement]);

    return (
      <>
        <Component
          ref={mergeRefs(ref, editorRef)}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className={cn(`outline-none focus:outline-none`, className)}
          // @ts-ignore ignore placeholder attribute
          placeholder={placeholder}
          id={id}
          onClick={onClick}
          disabled={disabled}
        />

        {showToolbar &&
          typeof defaultView !== "undefined" &&
          createPortal(
            <div ref={toolbarRef}>
              <FloatingToolbar
                position={toolbarPosition}
                documentElement={documentElement}
              />
            </div>,
            portalContainerElement,
          )}

        {showAutocomplete &&
          variables &&
          typeof defaultView !== "undefined" &&
          createPortal(
            <div ref={autocompleteRef}>
              <VariableAutocomplete
                position={autocompletePosition}
                query={variableQuery}
                variables={variables}
                onSelect={handleVariableSelect}
                onClose={() => setShowAutocomplete(false)}
                documentElement={documentElement}
              />
            </div>,
            portalContainerElement,
          )}
      </>
    );
  },
);

EditableTextInner.displayName = "EditableTextInner";

// Outer component that provides the context
export const EditableText = forwardRef<HTMLDivElement, EditableTextProps>(
  (
    {
      value,
      onChange,
      placeholder = "Type something...",
      className = "",
      inline = false,
      variables,
      id,
      onClick,
      disabledFeatures = [],
      documentElement = document,
      portalContainer = "body",
    },
    ref,
  ) => {
    const defaultView = documentElement.defaultView ?? window;
    const editorRef = useRef<HTMLDivElement>(null);
    const [history, setHistory] = useState<{
      history: RichTextValue[];
      historyIndex: number;
    }>({
      history: [],
      historyIndex: -1,
    });

    const isUndoRedoRef = useRef(false);
    const lastValueRef = useRef<string>("");
    const popoverRefs = useRef<Set<HTMLElement>>(new Set());

    const registerPopoverRef = useCallback((element: HTMLElement | null) => {
      if (element) {
        popoverRefs.current.add(element);
      }
      return () => {
        if (element) {
          popoverRefs.current.delete(element);
        }
      };
    }, []);

    const richTextValue =
      typeof value === "string" ? stringToRichText(value) : value;

    const debouncedHistoryChange = useDebounceCallback(
      (value: RichTextValue) => {
        setHistory(({ history, historyIndex }) => {
          const newHistory = history.slice(0, historyIndex + 1);
          newHistory.push(value);

          if (newHistory.length > 50) {
            newHistory.shift();
            return { history: newHistory, historyIndex };
          }

          return { history: newHistory, historyIndex: historyIndex + 1 };
        });
      },
      [],
      500,
    );

    useEffect(() => {
      const valueStr = JSON.stringify(richTextValue);

      if (isUndoRedoRef.current) {
        isUndoRedoRef.current = false;
        lastValueRef.current = valueStr;
        return;
      }

      if (valueStr === lastValueRef.current) {
        return;
      }

      lastValueRef.current = valueStr;
      debouncedHistoryChange(richTextValue);
    }, [richTextValue, debouncedHistoryChange]);

    const handleHistoryChange = useCallback(
      (index: number) => {
        isUndoRedoRef.current = true;
        const newValue = history.history[index];
        setHistory(({ history }) => ({
          history,
          historyIndex: index,
        }));

        onChange(newValue);
      },
      [onChange, history.history],
    );

    return (
      <RTEProvider
        value={richTextValue}
        onChange={onChange}
        editorRef={editorRef}
        defaultView={defaultView}
        documentElement={documentElement}
        variables={variables}
        historyIndex={history.historyIndex}
        historyLength={history.history.length}
        onHistoryChange={handleHistoryChange}
        disabledFeatures={disabledFeatures}
        registerPopoverRef={registerPopoverRef}
      >
        <EditableTextInner
          ref={ref}
          placeholder={placeholder}
          className={className}
          inline={inline}
          variables={variables}
          id={id}
          onClick={onClick}
          disabledFeatures={disabledFeatures}
          documentElement={documentElement}
          portalContainer={portalContainer}
          richTextValue={richTextValue}
          popoverRefs={popoverRefs}
        />
      </RTEProvider>
    );
  },
);

EditableText.displayName = "EditableText";
