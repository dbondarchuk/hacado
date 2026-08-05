import React from "react";

import type { ClientRectObject } from "@floating-ui/core";
import {
  getDefaultBoundingClientRect,
  getRangeBoundingClientRect,
  type UseVirtualFloatingOptions,
} from "@udecode/plate-floating";
import {
  createPrimitiveComponent,
  useComposedRef,
  useEditorPlugin,
  useEditorReadOnly,
  useEditorRef,
  useEditorVersion,
  useFocused,
  useHotkeys,
  useOnClickOutside,
  usePluginOption,
} from "@udecode/plate/react";

import { PageListModelWithUrl } from "@hacado/types";
import {
  encodeUrlIfNeeded,
  safeDecodeUrl,
  unwrapLink,
} from "@udecode/plate-link";
import {
  LinkPlugin,
  submitFloatingLink,
  triggerFloatingLinkEdit,
  triggerFloatingLinkInsert,
  useVirtualFloatingLink,
} from "@udecode/plate-link/react";
import { useAbsoluteUrl } from "./absolute-url-context";
import { useWindow } from "./window-context";

export const getDOMSelectionBoundingClientRect = (
  window: Window,
): ClientRectObject => {
  const domSelection = window.getSelection();

  if (!domSelection || domSelection.rangeCount < 1) {
    return getDefaultBoundingClientRect();
  }

  const domRange = domSelection.getRangeAt(0);

  return domRange.getBoundingClientRect();
};

export type LinkFloatingToolbarState = {
  floatingOptions?: UseVirtualFloatingOptions;
};

export const useFloatingLinkInsertState = ({
  floatingOptions,
}: LinkFloatingToolbarState = {}) => {
  const { editor, getOptions } = useEditorPlugin(LinkPlugin);

  const { triggerFloatingLinkHotkeys } = getOptions();
  const readOnly = useEditorReadOnly();
  const focused = useFocused();
  const mode = usePluginOption(LinkPlugin, "mode");
  const isOpen = usePluginOption(LinkPlugin, "isOpen", editor.id);

  const window = useWindow();

  const [isPageSelectorOpen, setIsPageSelectorOpen] = React.useState(false);

  const floating = useVirtualFloatingLink({
    editorId: editor.id,
    getBoundingClientRect: () => getDOMSelectionBoundingClientRect(window),
    open: isOpen && mode === "insert",
    whileElementsMounted: () => () => {},
    ...floatingOptions,
  });

  return {
    floating,
    focused,
    isOpen,
    readOnly,
    triggerFloatingLinkHotkeys,
    pageSelector: {
      isOpen: isPageSelectorOpen,
      setIsOpen: setIsPageSelectorOpen,
    },
  };
};

export const useFloatingLinkInsert = ({
  floating,
  focused,
  isOpen,
  readOnly,
  triggerFloatingLinkHotkeys,
  pageSelector,
}: ReturnType<typeof useFloatingLinkInsertState>) => {
  const { api, editor, getOptions, setOption } = useEditorPlugin(LinkPlugin);

  const onChange: React.ChangeEventHandler<HTMLInputElement> =
    React.useCallback(
      (e) => {
        setOption("text", e.target.value);
      },
      [setOption],
    );

  const onNewTabChange = React.useCallback(
    (checked: boolean) => {
      setOption("newTab", checked);
    },
    [setOption],
  );

  const window = useWindow();
  const usesAbsoluteUrl = useAbsoluteUrl();

  const ref = useOnClickOutside(
    () => {
      if (getOptions().mode === "insert") {
        api.floatingLink.hide();
        editor.tf.focus({ at: editor.selection! });
      }
    },
    {
      disabled: !isOpen || pageSelector.isOpen,
      detectIFrame: true,
    },
  );

  // wait for update before focusing input
  React.useEffect(() => {
    if (isOpen) {
      floating.update();
      setOption("updated", true);
    } else {
      setOption("updated", false);
      pageSelector.setIsOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, floating.update]);

  useHotkeys(
    triggerFloatingLinkHotkeys!,
    (e) => {
      if (triggerFloatingLinkInsert(editor, { focused })) {
        e.preventDefault();
      }
    },
    {
      enableOnContentEditable: true,
      document: window?.document,
    },
    [focused],
  );

  useFloatingLinkEscape();

  const { text, newTab, updated } = getOptions();

  const updatedValue = React.useCallback(
    (el: HTMLInputElement) => {
      if (el && updated) {
        el.value = getOptions().text;
      }
    },
    [getOptions, updated],
  );

  const updatedNewTabValue = React.useCallback(
    (el: HTMLInputElement) => {
      if (el && updated) {
        el.checked = getOptions().newTab;
      }
    },
    [getOptions, updated],
  );

  const apply = React.useCallback(() => {
    submitFloatingLink(editor);
  }, [editor]);

  const setUrl = React.useCallback(
    (url: string) => {
      setOption("url", url);
      setOption("updated", true);
    },
    [setOption],
  );

  return {
    hidden: readOnly || !isOpen,
    props: {
      style: {
        ...floating.style,
        zIndex: 50,
      },
    },
    ref: useComposedRef<HTMLDivElement>(floating.refs.setFloating, ref),
    textInputProps: {
      defaultValue: text,
      ref: updatedValue,
      onChange,
    },
    openInNewTabInputProps: {
      defaultValue: newTab,
      onCheckedChange: onNewTabChange,
      ref: updatedNewTabValue,
    },
    apply,
    setUrl,
    onPageSelectorSelected: (page: PageListModelWithUrl) => {
      const value = encodeUrlIfNeeded(
        usesAbsoluteUrl ? page.url : `/${page.slug}`,
      );
      setOption("url", value);
      setOption("updated", true);
      pageSelector.setIsOpen(false);

      return value;
    },
  };
};

export const useFloatingLinkEditState = ({
  floatingOptions,
}: LinkFloatingToolbarState = {}) => {
  const { editor, getOptions, type } = useEditorPlugin(LinkPlugin);

  const { triggerFloatingLinkHotkeys } = getOptions();
  const readOnly = useEditorReadOnly();
  const isEditing = usePluginOption(LinkPlugin, "isEditing");
  const version = useEditorVersion();
  const mode = usePluginOption(LinkPlugin, "mode");
  const open = usePluginOption(LinkPlugin, "isOpen", editor.id);
  const window = useWindow();

  const getBoundingClientRect = React.useCallback(() => {
    const entry = editor.api.above({
      match: { type },
    });

    if (entry) {
      const [, path] = entry;

      return getRangeBoundingClientRect(editor, {
        anchor: editor.api.start(path)!,
        focus: editor.api.end(path)!,
      });
    }

    return getDOMSelectionBoundingClientRect(window);
  }, [editor, type, window]);

  const isOpen = open && mode === "edit";

  const floating = useVirtualFloatingLink({
    editorId: editor.id,
    getBoundingClientRect,
    open: isOpen,
    ...floatingOptions,
  });

  return {
    editor,
    floating,
    isEditing,
    isOpen,
    readOnly,
    triggerFloatingLinkHotkeys,
    versionEditor: version,
  };
};

export const useFloatingLinkEdit = (
  {
    editor,
    floating,
    triggerFloatingLinkHotkeys,
    versionEditor,
  }: ReturnType<typeof useFloatingLinkEditState>,
  isPageSelectorOpen?: boolean,
) => {
  const { api, getOptions } = useEditorPlugin(LinkPlugin);
  const window = useWindow();

  React.useEffect(() => {
    if (
      editor.selection &&
      editor.api.some({
        match: { type: editor.getType(LinkPlugin) },
      })
    ) {
      api.floatingLink.show("edit", editor.id);
      floating.update();

      return;
    }
    if (getOptions().mode === "edit") {
      api.floatingLink.hide();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, versionEditor, floating.update]);

  useHotkeys(
    triggerFloatingLinkHotkeys!,
    (e) => {
      if (getOptions().mode === "edit" && triggerFloatingLinkEdit(editor)) {
        e.preventDefault();
      }
    },
    {
      enableOnContentEditable: true,
      document: window.document,
    },
    [],
  );

  useFloatingLinkEnter();

  useFloatingLinkEscape();

  const clickOutsideRef = useOnClickOutside(
    () => {
      if (!getOptions().isEditing) return;

      api.floatingLink.hide();
    },
    {
      detectIFrame: true,
      disabled: isPageSelectorOpen,
    },
  );

  return {
    editButtonProps: {
      onClick: () => {
        triggerFloatingLinkEdit(editor);
      },
    },
    props: {
      style: {
        ...floating.style,
        zIndex: 50,
      },
    },
    ref: useComposedRef<HTMLElement | null>(
      floating.refs.setFloating,
      clickOutsideRef,
    ),
    unlinkButtonProps: {
      onClick: () => {
        unwrapLink(editor);
      },
      onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
      },
    },
  };
};

export const useFloatingLinkEnter = () => {
  const editor = useEditorRef();
  const window = useWindow();

  const open = usePluginOption(LinkPlugin, "isOpen", editor.id);

  useHotkeys(
    "*",
    (e) => {
      if (e.key !== "Enter") return;
      if (submitFloatingLink(editor)) {
        e.preventDefault();
      }
    },
    {
      enabled: open,
      enableOnFormTags: ["INPUT"],
      document: window.document,
    },
    [],
  );
};

export const useFloatingLinkEscape = () => {
  const { api, editor, getOptions } = useEditorPlugin(LinkPlugin);
  const window = useWindow();

  const open = usePluginOption(LinkPlugin, "isOpen", editor.id);

  useHotkeys(
    "escape",
    (e) => {
      const { isEditing, mode } = getOptions();

      if (!mode) return;

      e.preventDefault();

      if (mode === "edit" && isEditing) {
        api.floatingLink.show("edit", editor.id);
        editor.tf.focus({ at: editor.selection! });

        return;
      }
      if (mode === "insert") {
        editor.tf.focus({ at: editor.selection! });
      }

      api.floatingLink.hide();
    },
    {
      enabled: open,
      enableOnContentEditable: true,
      enableOnFormTags: ["INPUT"],
      document: window.document,
    },
    [],
  );
};

export const useFloatingLinkUrlInputState = () => {
  const { getOptions } = useEditorPlugin(LinkPlugin);
  const updated = usePluginOption(LinkPlugin, "updated");
  const ref = React.useRef<HTMLInputElement>(null);
  const focused = React.useRef(false);

  React.useEffect(() => {
    if (ref.current && updated) {
      setTimeout(() => {
        const input = ref.current;

        if (!input) return;
        if (focused.current) return;

        focused.current = true;

        const url = getOptions().url;
        input.focus();
        input.value = url ? safeDecodeUrl(url) : "";
      }, 0);
    }
  }, [getOptions, updated]);

  return {
    ref,
  };
};

export const useFloatingLinkUrlInput = (
  state: ReturnType<typeof useFloatingLinkUrlInputState>,
) => {
  const { getOptions, setOption } = useEditorPlugin(LinkPlugin);

  const onChange: React.ChangeEventHandler<HTMLInputElement> =
    React.useCallback(
      (e) => {
        const url = encodeUrlIfNeeded(e.target.value);
        setOption("url", url);
      },
      [setOption],
    );

  return {
    props: {
      defaultValue: getOptions().url,
      onChange,
    },
    ref: state.ref,
  };
};

export const FloatingLinkUrlInput = createPrimitiveComponent("input")({
  propsHook: useFloatingLinkUrlInput,
  stateHook: useFloatingLinkUrlInputState,
});
