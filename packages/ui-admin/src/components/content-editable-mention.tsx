// @ts-nocheck
"use client";

import {
  cn,
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  mergeRefs,
} from "@hacado/ui";
import React, {
  CSSProperties,
  JSX,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { MentionData } from "./textarea-mention";

const isBrowser = typeof window !== "undefined";

function getCaretPosition(element: HTMLElement, documentElement: Document) {
  if (!isBrowser) return 0;
  let _range = documentElement.getSelection()?.getRangeAt(0);
  if (!_range) return 0;
  let range = _range.cloneRange();
  range.selectNodeContents(element);
  range.setEnd(_range.endContainer, _range.endOffset);
  return range.toString().length;
}

function setCaretPosition(
  element: HTMLElement,
  position: number,
  documentElement: Document,
) {
  if (!isBrowser) return;

  const selection = window.getSelection();
  const range = documentElement.createRange();

  let currentPos = 0;
  let found = false;

  function traverse(node: Node) {
    if (found) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const nodeLength = node.textContent?.length || 0;
      if (currentPos + nodeLength >= position) {
        range.setStart(node, position - currentPos);
        range.setEnd(node, position - currentPos);
        found = true;
        return;
      }
      currentPos += nodeLength;
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        traverse(node.childNodes[i]);
        if (found) return;
      }
    }
  }

  traverse(element);

  if (found && selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function getCurrentWordPos(
  element: HTMLElement,
  trigger: string,
  documentElement: Document,
) {
  const text = element.innerText || "";
  const caretStartIndex = getCaretPosition(element, documentElement);

  // Find the start position of the word
  let start = caretStartIndex;
  while (
    start > 0 &&
    text[start - 1]?.match(/\S/) &&
    text.substring(start, start + trigger.length) !== trigger
  ) {
    start--;
  }

  // Find the end position of the word
  let end = caretStartIndex;
  while (end < text.length && text[end].match(/\S/)) {
    end++;
  }

  return { start, end, text };
}

function getCurrentWord(
  element: HTMLElement,
  trigger: string,
  documentElement: Document,
) {
  const { start, end, text } = getCurrentWordPos(
    element,
    trigger,
    documentElement,
  );
  const w = text.substring(start, end);

  return w;
}

function replaceWord(
  element: HTMLElement,
  value: string,
  trigger: string,
  documentElement: Document,
) {
  const { start: startIndex, end: endIndex } = getCurrentWordPos(
    element,
    trigger,
    documentElement,
  );

  // Replace the word with a new word using document.execCommand
  if (startIndex !== undefined && endIndex !== undefined) {
    const selection = documentElement.getSelection();
    const range = documentElement.createRange();

    let currentPos = 0;
    let startNode: Node | null = null;
    let startOffset = 0;
    let endNode: Node | null = null;
    let endOffset = 0;

    function traverse(node: Node) {
      if (startNode && endNode) return;

      if (node.nodeType === Node.TEXT_NODE) {
        const nodeLength = node.textContent?.length || 0;

        // Find start position
        if (!startNode && currentPos + nodeLength >= startIndex) {
          startNode = node;
          startOffset = startIndex - currentPos;
        }

        // Find end position
        if (!endNode && currentPos + nodeLength >= endIndex) {
          endNode = node;
          endOffset = endIndex - currentPos;
        }

        currentPos += nodeLength;
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          traverse(node.childNodes[i]);
          if (startNode && endNode) return;
        }
      }
    }

    traverse(element);

    if (startNode && endNode && selection) {
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);

      selection.removeAllRanges();
      selection.addRange(range);

      // Execute the command to replace the selected text with the new word
      documentElement.execCommand("insertText", false, value);
    }
  }
}

function getCaretCoordinates(element: HTMLElement, documentElement: Document) {
  let top = 0,
    left = 0,
    height = 0;
  const isSupported = typeof documentElement.getSelection !== "undefined";
  if (isSupported) {
    const selection = documentElement.getSelection();
    if (!!selection?.rangeCount) {
      const range = selection.getRangeAt(0).cloneRange();
      range.collapse(true);
      const rect = range.getClientRects()[0];
      if (rect) {
        left = rect.left;
        top = rect.top;
        height = rect.height;
      }
    }
  }
  return { top, left, height };
}

type ContentEditableTagNames = {
  [K in keyof JSX.IntrinsicElements]: "contentEditable" extends keyof JSX.IntrinsicElements[K]
    ? "onInput" extends keyof JSX.IntrinsicElements[K]
      ? K
      : never
    : never;
}[keyof JSX.IntrinsicElements];

type Props = {
  value: string;
  onChange?: (value: string) => void;
  data: MentionData[];
  trigger?: string;
  itemRenderer?: (item: MentionData) => React.ReactNode;
  insertTransform?: (item: MentionData) => string;
  element: ContentEditableTagNames;
  className?: string;
  style?: CSSProperties;
  id?: string;
  placeholder?: string;
  documentElement?: Document;
};

export const ContentEditableMentions = React.forwardRef<HTMLElement, Props>(
  (
    {
      value: textValue,
      onChange: setTextValue,
      data,
      trigger = "@",
      itemRenderer,
      insertTransform,
      className,
      element: Tag,
      placeholder,
      documentElement = document,
      ...rest
    },
    ref,
  ) => {
    const [isInside, setIsInside] = useState(false);
    const elementRef = useRef<HTMLElement>(null);
    const lastCursorPosition = useRef<number>(0);
    const isUpdatingContent = useRef<boolean>(false);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [commandValue, setCommandValue] = useState("");

    const handleBlur = useCallback((e: Event) => {
      const dropdown = dropdownRef.current;
      if (dropdown) {
        dropdown.classList.add("hidden");
        setCommandValue("");
      }
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
      const textarea = elementRef.current;
      const input = inputRef.current;
      const dropdown = dropdownRef.current;
      if (textarea && input && dropdown) {
        const currentWord = getCurrentWord(textarea, trigger, documentElement);
        const isDropdownHidden =
          dropdown.classList.contains("hidden") || dropdown.offsetHeight < 10;
        if (currentWord.startsWith(trigger) && !isDropdownHidden) {
          // FIXME: handle Escape
          if (
            e.key === "ArrowUp" ||
            e.keyCode === 38 ||
            e.key === "ArrowDown" ||
            e.keyCode === 40 ||
            e.key === "Enter" ||
            e.keyCode === 13 ||
            e.key === "Escape" ||
            e.keyCode === 27
          ) {
            e.preventDefault();
            e.stopPropagation();
            input.dispatchEvent(new KeyboardEvent("keydown", e));
          }
        }
      }
    }, []);

    const onTextValueChange = useCallback(
      (text: string) => {
        const htmlElement = elementRef.current;
        const dropdown = dropdownRef.current;

        // Store cursor position before updating content
        if (htmlElement) {
          lastCursorPosition.current = getCaretPosition(
            htmlElement,
            documentElement,
          );
        }

        // Don't update textContent here - let React handle it
        setTextValue?.(text);

        if (htmlElement && dropdown) {
          const caret = getCaretCoordinates(htmlElement, documentElement);
          const currentWord = getCurrentWord(
            htmlElement,
            trigger,
            documentElement,
          );
          if (currentWord.startsWith(trigger)) {
            setCommandValue(currentWord.substring(trigger.length));
            dropdown.style.left = caret.left + "px";
            dropdown.style.top = caret.top + caret.height + "px";
            dropdown.classList.remove("hidden");
          } else {
            // REMINDER: apparently, we need it when deleting
            if (commandValue !== "") {
              setCommandValue("");
              dropdown.classList.add("hidden");
            }
          }
        }
      },
      [setTextValue, commandValue],
    );

    const onCommandSelect = useCallback((value: MentionData) => {
      const textarea = elementRef.current;
      const dropdown = dropdownRef.current;
      if (textarea && dropdown) {
        replaceWord(
          textarea,
          insertTransform ? insertTransform(value) : `${value.id}`,
          trigger,
          documentElement,
        );

        setCommandValue("");
        dropdown.classList.add("hidden");
      }
    }, []);

    const handleMouseDown = useCallback((e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleSectionChange = useCallback(
      (e: Event) => {
        if (!isInside) return;
        const textarea = elementRef.current;
        const dropdown = dropdownRef.current;
        if (textarea && dropdown) {
          const currentWord = getCurrentWord(
            textarea,
            trigger,
            documentElement,
          );
          if (!currentWord.startsWith(trigger) && commandValue !== "") {
            setCommandValue("");
            dropdown.classList.add("hidden");
          }
        }
      },
      [commandValue],
    );

    const toggleInside = (e: any) => {
      setIsInside(
        !!e?.target && !!elementRef.current?.contains(e.target as any),
      );
    };

    useEffect(() => {
      const textarea = elementRef.current;
      const dropdown = dropdownRef.current;
      const keyDownHandler = (e: Event) => handleKeyDown(e as KeyboardEvent);

      documentElement.addEventListener("click", toggleInside);
      documentElement.addEventListener("keyup", toggleInside);

      textarea?.addEventListener("keydown", keyDownHandler);
      textarea?.addEventListener("blur", handleBlur);
      documentElement?.addEventListener("selectionchange", handleSectionChange);
      dropdown?.addEventListener("mousedown", handleMouseDown);
      return () => {
        documentElement.removeEventListener("click", toggleInside);
        documentElement.removeEventListener("keyup", toggleInside);

        textarea?.removeEventListener("keydown", keyDownHandler);
        textarea?.removeEventListener("blur", handleBlur);
        documentElement?.removeEventListener(
          "selectionchange",
          handleSectionChange,
        );
        dropdown?.removeEventListener("mousedown", handleMouseDown);
      };
    }, [handleBlur, handleKeyDown, handleMouseDown, handleSectionChange]);

    // Only update content when the value changes externally (not from user input)
    useEffect(() => {
      if (textValue && elementRef.current && !isUpdatingContent.current) {
        const currentText = elementRef.current.innerText || "";
        if (currentText !== textValue) {
          isUpdatingContent.current = true;
          elementRef.current.innerText = textValue;
          // Restore cursor position after content update
          if (lastCursorPosition.current > 0) {
            setCaretPosition(
              elementRef.current,
              Math.min(lastCursorPosition.current, textValue.length),
              documentElement,
            );
          }
          isUpdatingContent.current = false;
        }
      }
    }, [textValue, Tag]);

    const mergedRef = mergeRefs(ref, elementRef) as any;

    return (
      <>
        <Tag
          ref={mergedRef}
          contentEditable="plaintext-only"
          suppressContentEditableWarning
          className={className}
          placeholder={placeholder}
          // @ts-ignore ignore onInput
          onInput={(e) => onTextValueChange((e.target as any).innerText)}
          {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
        />
        <Command
          ref={dropdownRef}
          className={cn(
            "fixed hidden h-auto max-w-min border border-popover shadow z-[46]",
          )}
        >
          <div className="hidden">
            {/* REMINDER: className="hidden" won't hide the SearchIcon and border */}
            <CommandInput ref={inputRef} value={commandValue} />
          </div>
          <CommandList>
            <CommandGroup className="max-w-min font-normal text-left font-primary">
              {data.map((item) => {
                return (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => onCommandSelect(item)}
                  >
                    {itemRenderer
                      ? itemRenderer(item)
                      : item.display || item.id}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </>
    );
  },
);
