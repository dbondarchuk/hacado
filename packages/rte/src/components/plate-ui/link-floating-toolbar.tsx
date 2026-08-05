"use client";

import { cn } from "@udecode/cn";
import {
  type UseVirtualFloatingOptions,
  flip,
  offset,
  useId,
} from "@udecode/plate-floating";
import {
  type LinkFloatingToolbarState,
  LinkOpenButton,
} from "@udecode/plate-link/react";

import { useFormInputProps } from "@udecode/plate/react";
import { ExternalLink, Globe, Link, Text, Unlink } from "lucide-react";

import {
  FloatingLinkUrlInput,
  useFloatingLinkEdit,
  useFloatingLinkEditState,
  useFloatingLinkInsert,
  useFloatingLinkInsertState,
} from "./use-floating-link";

import {
  Button,
  buttonVariants,
  Checkbox,
  inputVariants,
  Label,
  popoverVariants,
  Separator,
} from "@hacado/ui";
import { PageSelectorDialog } from "@hacado/ui-admin";
import { useRef } from "react";
import { useWindow } from "./window-context";

const floatingOptions: UseVirtualFloatingOptions = {
  middleware: [
    offset(12),
    flip({
      fallbackPlacements: ["bottom-end", "top-start", "top-end"],
      padding: 12,
    }),
  ],
  placement: "bottom-start",
};

export interface LinkFloatingToolbarProps {
  state?: LinkFloatingToolbarState;
}

export function LinkFloatingToolbar({ state }: LinkFloatingToolbarProps) {
  const insertState = useFloatingLinkInsertState({
    ...state,
    floatingOptions: {
      ...floatingOptions,
      ...state?.floatingOptions,
    },
  });
  const {
    hidden,
    props: insertProps,
    ref: insertRef,
    textInputProps,
    openInNewTabInputProps,
    apply,
    onPageSelectorSelected,
  } = useFloatingLinkInsert(insertState);

  const editState = useFloatingLinkEditState({
    ...state,
    floatingOptions: {
      ...floatingOptions,
      ...state?.floatingOptions,
    },
  });

  const { pageSelector } = insertState;

  const {
    editButtonProps,
    props: editProps,
    ref: editRef,
    unlinkButtonProps,
  } = useFloatingLinkEdit(editState, pageSelector.isOpen);
  const inputProps = useFormInputProps({
    preventDefaultOnEnterKeydown: true,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const newTabId = useId();
  const newTabRef = useRef<HTMLButtonElement>(null);
  const window = useWindow();

  if (hidden) return null;

  const input = (
    <div className="flex w-[330px] flex-col font-primary" {...inputProps}>
      <div className="flex items-center">
        <div className="flex items-center pr-1 pl-2 text-muted-foreground">
          <Link className="size-4" />
        </div>

        <FloatingLinkUrlInput
          className={inputVariants({ h: "sm", variant: "ghost" })}
          placeholder="Paste link"
          data-plate-focus
          ref={inputRef}
        />

        <PageSelectorDialog
          portalContainer={window.document.body}
          isOpen={pageSelector.isOpen}
          close={() => pageSelector.setIsOpen(false)}
          onSelected={(page) => {
            const value = onPageSelectorSelected(page);
            if (inputRef.current) {
              inputRef.current.value = value;
            }
          }}
        />

        <Button
          variant="outline"
          size="icon"
          onClick={() => pageSelector.setIsOpen(true)}
        >
          <Globe className="size-4" />
        </Button>
      </div>
      <Separator className="my-1" />
      <div className="flex flex-row gap-1 items-center">
        <div className="flex items-center flex-1">
          <div className="flex items-center pr-1 pl-2 text-muted-foreground">
            <Text className="size-4" />
          </div>
          <input
            className={inputVariants({ h: "sm", variant: "ghost" })}
            placeholder="Text to display"
            data-plate-focus
            {...textInputProps}
          />
        </div>

        <Separator className="mx-1 h-5" orientation="vertical" />
        <div className="flex items-center">
          <div className="flex items-center pr-1 text-muted-foreground">
            <ExternalLink className="size-4" />
          </div>
          <div className="flex items-center gap-1 pr-2">
            <Checkbox
              name={newTabId}
              id={newTabId}
              defaultChecked={openInNewTabInputProps.defaultValue}
              onCheckedChange={(checked) =>
                openInNewTabInputProps.onCheckedChange(checked as boolean)
              }
              className="size-3.5 [&_svg]:size-3"
              ref={newTabRef}
            />
            <Label
              htmlFor={newTabId}
              // For some reason the checkbox is not clickable when the label is clicked
              // so we need to click the checkbox directly
              onClick={() => newTabRef.current?.click()}
              className="text-xs font-normal"
            >
              New tab
            </Label>
          </div>
        </div>
      </div>

      <Separator className="my-1" />
      <Button size="xs" variant="ghost" className="w-full" onClick={apply}>
        Apply
      </Button>
    </div>
  );

  const editContent = editState.isEditing ? (
    input
  ) : (
    <div className="box-content flex items-center font-primary">
      <button
        className={buttonVariants({ size: "sm", variant: "ghost" })}
        type="button"
        {...editButtonProps}
      >
        Edit link
      </button>

      <Separator orientation="vertical" />

      <LinkOpenButton
        className={buttonVariants({
          size: "icon",
          variant: "ghost",
        })}
      >
        <ExternalLink width={18} />
      </LinkOpenButton>

      <Separator orientation="vertical" />

      <button
        className={buttonVariants({
          size: "icon",
          variant: "ghost",
        })}
        type="button"
        {...unlinkButtonProps}
      >
        <Unlink width={18} />
      </button>
    </div>
  );

  return (
    <>
      <div
        ref={insertRef}
        className={cn(popoverVariants(), "w-auto p-1")}
        {...insertProps}
        style={{
          ...insertProps.style,
          // top: currentAbsolutePosition?.y,
          // left: currentAbsolutePosition?.x,
        }}
      >
        {input}
      </div>

      <div
        ref={editRef}
        className={cn(popoverVariants(), "w-auto p-1")}
        {...editProps}
        style={{
          ...editProps.style,
          // top: currentAbsolutePosition?.y,
          // left: currentAbsolutePosition?.x,
        }}
      >
        {editContent}
      </div>
    </>
  );
}
