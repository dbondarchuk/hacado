"use client";

import {
  cn,
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Input,
  mergeRefs,
  Textarea,
  TextareaProps,
} from "@hacado/ui";
import React, { useCallback, useEffect, useRef, useState } from "react";

// https://github.com/component/textarea-caret-position

// We'll copy the properties below into the mirror div.
// Note that some browsers, such as Firefox, do not concatenate properties
// into their shorthand (e.g. padding-top, padding-bottom etc. -> padding),
// so we have to list every single property explicitly.
const properties = [
  "direction", // RTL support
  "boxSizing",
  "width", // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does
  "height",
  "overflowX",
  "overflowY", // copy the scrollbar for IE

  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderStyle",

  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",

  // https://developer.mozilla.org/en-US/docs/Web/CSS/font
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "fontSizeAdjust",
  "lineHeight",
  "fontFamily",

  "textAlign",
  "textTransform",
  "textIndent",
  "textDecoration", // might not make a difference, but better be safe

  "letterSpacing",
  "wordSpacing",

  "tabSize",
  "MozTabSize",
] as const;

const isBrowser = typeof window !== "undefined";
// @ts-expect-error
const isFirefox = isBrowser && window.mozInnerScreenX != null;

function getCaretPosition(element: HTMLTextAreaElement | HTMLInputElement) {
  return {
    caretStartIndex: element.selectionStart || 0,
    caretEndIndex: element.selectionEnd || 0,
  };
}

function getCurrentWordPos(
  element: HTMLTextAreaElement | HTMLInputElement,
  trigger: string,
) {
  const text = element.value;
  const { caretStartIndex } = getCaretPosition(element);

  // Find the start position of the word
  let start = caretStartIndex;
  while (
    start > 0 &&
    text[start - 1].match(/\S/) &&
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
  element: HTMLTextAreaElement | HTMLInputElement,
  trigger: string,
) {
  const { start, end, text } = getCurrentWordPos(element, trigger);
  const w = text.substring(start, end);

  return w;
}

function replaceWord(
  element: HTMLTextAreaElement | HTMLInputElement,
  value: string,
  trigger: string,
  documentElement: Document,
) {
  //   const text = element.value;
  //   const caretPos = element.selectionStart;

  //   // Find the word that needs to be replaced
  //   const wordRegex = new RegExp(`(\w|(?:${escapeRegex(trigger)}))+`, "g");
  //   let match;
  //   let startIndex;
  //   let endIndex;

  //   while ((match = wordRegex.exec(text)) !== null) {
  //     startIndex = match.index;
  //     endIndex = startIndex + match[0].length;

  //     if (caretPos >= startIndex && caretPos <= endIndex) {
  //       break;
  //     }
  //   }
  const { start: startIndex, end: endIndex } = getCurrentWordPos(
    element,
    trigger,
  );

  // Replace the word with a new word using document.execCommand
  if (startIndex !== undefined && endIndex !== undefined) {
    // Preserve the current selection range
    const selectionStart = element.selectionStart || 0;
    const selectionEnd = element.selectionEnd || 0;

    // Modify the selected range to encompass the word to be replaced
    element.setSelectionRange(startIndex, endIndex);

    // REMINDER: Fastest way to include CMD + Z compatibility
    // Execute the command to replace the selected text with the new word
    documentElement.execCommand("insertText", false, value);

    // Restore the original selection range
    element.setSelectionRange(
      selectionStart - (endIndex - startIndex) + value.length,
      selectionEnd - (endIndex - startIndex) + value.length,
    );
  }
}

function getCaretCoordinates(
  element: HTMLTextAreaElement | HTMLInputElement,
  position: number,
  documentElement: Document,
  options?: { debug: boolean },
) {
  if (!isBrowser) {
    throw new Error(
      "textarea-caret-position#getCaretCoordinates should only be called in a browser",
    );
  }

  var debug = (options && options.debug) || false;
  if (debug) {
    var el = documentElement.querySelector(
      "#input-textarea-caret-position-mirror-div",
    );
    if (el) el?.parentNode?.removeChild(el);
  }

  // The mirror div will replicate the textarea's style
  var div = documentElement.createElement("div");
  div.id = "input-textarea-caret-position-mirror-div";
  documentElement.body.appendChild(div);

  var style = div.style;
  var computed = documentElement.defaultView!.getComputedStyle(element);
  var isInput = element.nodeName === "INPUT";

  // Default textarea styles
  style.whiteSpace = "pre-wrap";
  if (!isInput) style.wordWrap = "break-word"; // only for textarea-s

  // Position off-screen
  style.position = "absolute"; // required to return coordinates properly
  if (!debug) style.visibility = "hidden"; // not 'display: none' because we want rendering

  // Transfer the element's properties to the div
  properties.forEach(function (prop) {
    if (isInput && prop === "lineHeight") {
      // Special case for <input>s because text is rendered centered and line height may be != height
      if (computed.boxSizing === "border-box") {
        var height = parseInt(computed.height);
        var outerHeight =
          parseInt(computed.paddingTop) +
          parseInt(computed.paddingBottom) +
          parseInt(computed.borderTopWidth) +
          parseInt(computed.borderBottomWidth);
        var targetHeight = outerHeight + parseInt(computed.lineHeight);
        if (height > targetHeight) {
          style.lineHeight = height - outerHeight + "px";
        } else if (height === targetHeight) {
          style.lineHeight = computed.lineHeight;
        } else {
          style.lineHeight = 0 + "px";
        }
      } else {
        style.lineHeight = computed.height;
      }
    } else {
      // @ts-expect-error
      style[prop] = computed[prop];
    }
  });

  if (isFirefox) {
    // Firefox lies about the overflow property for textareas: https://bugzilla.mozilla.org/show_bug.cgi?id=984275
    if (element.scrollHeight > parseInt(computed.height))
      style.overflowY = "scroll";
  } else {
    style.overflow = "hidden"; // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'
  }

  div.textContent = element.value.substring(0, position);
  // The second special handling for input type="text" vs textarea:
  // spaces need to be replaced with non-breaking spaces - http://stackoverflow.com/a/13402035/1269037
  if (isInput) div.textContent = div.textContent.replace(/\s/g, "\u00a0");

  var span = documentElement.createElement("span");
  // Wrapping must be replicated *exactly*, including when a long word gets
  // onto the next line, with whitespace at the end of the line before (#7).
  // The  *only* reliable way to do that is to copy the *entire* rest of the
  // textarea's content into the <span> created at the caret position.
  // For inputs, just '.' would be enough, but no need to bother.
  // REMINDER: changed it from "." to empty string ""...
  span.textContent = element.value.substring(position) || ""; // || because a completely empty faux span doesn't render at all
  div.appendChild(span);

  var coordinates = {
    top: span.offsetTop + parseInt(computed["borderTopWidth"]),
    left: span.offsetLeft + parseInt(computed["borderLeftWidth"]),
    height: parseInt(computed["lineHeight"]),
  };

  if (debug) {
    span.style.backgroundColor = "#aaa";
  } else {
    documentElement.body.removeChild(div);
  }

  return coordinates;
}

export type MentionData = {
  id: string;
  display?: string;
};

type Props = {
  value: string;
  onChange?: (value: string) => void;
  data: MentionData[];
  trigger?: string;
  itemRenderer?: (item: MentionData) => React.ReactNode;
  insertTransform?: (item: MentionData) => string;
  documentElement?: Document;
} & (
  | (Omit<TextareaProps, "onChange"> & {
      asInput?: boolean;
    })
  | (Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> & {
      asInput: true;
      // asContentEditable?: boolean;
    })
);

export const TextareaMentions = React.forwardRef<
  HTMLTextAreaElement | HTMLInputElement,
  Props
>(
  (
    {
      value: textValue,
      onChange: setTextValue,
      data,
      trigger = "@",
      itemRenderer,
      insertTransform,
      className,
      asInput,
      documentElement = document,
      ...rest
    },
    ref,
  ) => {
    const textareaRef = asInput
      ? useRef<HTMLInputElement>(null)
      : useRef<HTMLTextAreaElement>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [commandValue, setCommandValue] = useState("");

    // TODO: check if this is possible?!?
    // const texarea = textareaRef.current;
    // const dropdown = dropdownRef.current;

    const handleBlur = useCallback((e: Event) => {
      const dropdown = dropdownRef.current;
      if (dropdown) {
        dropdown.classList.add("hidden");
        setCommandValue("");
      }
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
      const textarea = textareaRef.current;
      const input = inputRef.current;
      const dropdown = dropdownRef.current;
      if (textarea && input && dropdown) {
        const currentWord = getCurrentWord(textarea, trigger);
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
            input.dispatchEvent(new KeyboardEvent("keydown", e));
          }
        }
      }
    }, []);

    const onTextValueChange = useCallback(
      (
        e: React.ChangeEvent<
          HTMLTextAreaElement | HTMLInputElement | HTMLSpanElement
        >,
      ) => {
        const text =
          e.target instanceof HTMLSpanElement
            ? e.target.innerText
            : e.target.value;
        const textarea = textareaRef.current;
        const dropdown = dropdownRef.current;

        if (textarea && dropdown) {
          const caret = getCaretCoordinates(
            textarea,
            textarea.selectionEnd || 0,
            documentElement,
          );
          const currentWord = getCurrentWord(textarea, trigger);
          setTextValue?.(text);
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
      const textarea = textareaRef.current;
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
        const textarea = textareaRef.current;
        const dropdown = dropdownRef.current;
        if (textarea && dropdown) {
          const currentWord = getCurrentWord(textarea, trigger);
          if (!currentWord.startsWith(trigger) && commandValue !== "") {
            setCommandValue("");
            dropdown.classList.add("hidden");
          }
        }
      },
      [commandValue],
    );

    useEffect(() => {
      const textarea = textareaRef.current;
      const dropdown = dropdownRef.current;
      const keyDownHandler = (e: Event) => handleKeyDown(e as KeyboardEvent);
      textarea?.addEventListener("keydown", keyDownHandler);
      textarea?.addEventListener("blur", handleBlur);
      document?.addEventListener("selectionchange", handleSectionChange);
      dropdown?.addEventListener("mousedown", handleMouseDown);
      return () => {
        textarea?.removeEventListener("keydown", keyDownHandler);
        textarea?.removeEventListener("blur", handleBlur);
        document?.removeEventListener("selectionchange", handleSectionChange);
        dropdown?.removeEventListener("mousedown", handleMouseDown);
      };
    }, [handleBlur, handleKeyDown, handleMouseDown, handleSectionChange]);

    return (
      <div className="relative w-full">
        {asInput ? (
          // "asContentEditable" in rest && rest.asContentEditable ? (
          //   <span
          //     ref={mergeRefs(
          //       ref as React.RefObject<HTMLInputElement | null>,
          //       textareaRef as React.RefObject<HTMLInputElement | null>
          //     )}
          //     contentEditable
          //     className={className}
          //     onInput={onTextValueChange}
          //     {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
          //   >
          //     {textValue}
          //   </span>
          // ) : (
          <Input
            ref={mergeRefs(
              ref as React.RefObject<HTMLInputElement | null>,
              textareaRef as React.RefObject<HTMLInputElement | null>,
            )}
            value={textValue}
            onChange={onTextValueChange}
            className={className}
            {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        ) : (
          // )
          <Textarea
            ref={mergeRefs(
              ref as React.RefObject<HTMLTextAreaElement | null>,
              textareaRef as React.RefObject<HTMLTextAreaElement | null>,
            )}
            autoComplete="off"
            autoCorrect="off"
            className={cn("h-auto resize-none", className)}
            value={textValue}
            onChange={onTextValueChange}
            {...(rest as React.InputHTMLAttributes<HTMLTextAreaElement>)}
          />
        )}
        <Command
          ref={dropdownRef}
          className={cn(
            "absolute hidden h-auto max-w-min border border-popover shadow z-[46]",
          )}
        >
          <div className="hidden">
            {/* REMINDER: className="hidden" won't hide the SearchIcon and border */}
            <CommandInput ref={inputRef} value={commandValue} />
          </div>
          <CommandList>
            <CommandGroup className="max-w-min ">
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
      </div>
    );
  },
);
