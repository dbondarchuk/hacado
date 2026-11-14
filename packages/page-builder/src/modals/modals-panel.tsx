"use client";

import {
  useDispatchAction,
  useFocusedModalId,
  useModalBlockDefinitions,
  useRootBlockId,
  useSetFocusedModalId,
  useSetSelectedBlockId,
} from "@hacado/builder/editor";
import { generateId } from "@hacado/builder/helpers";
import { useI18n } from "@hacado/i18n/client";
import type { BuilderKeys } from "@hacado/i18n/keys";
import { Button } from "@hacado/ui/button";
import { cn } from "@hacado/ui/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@hacado/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { type PageModalOption, usePageModals } from "./use-page-modals";

function getShowLabel(show: string | undefined, t: (key: string) => string) {
  if (show === "always") return t("baseBuilder.modals.show.always");
  if (show === "one-time") return t("baseBuilder.modals.show.oneTime");
  if (show === "on-click") return t("baseBuilder.modals.show.onClick");

  return null;
}

const ModalRow = memo(
  ({
    item,
    label,
    icon,
    isActive,
    onEdit,
    onDelete,
  }: {
    item: PageModalOption;
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
  }) => {
    const t = useI18n("builder");
    const showLabel = getShowLabel(item.show, t);

    return (
      <div
        className={cn(
          "flex items-start gap-2 rounded-md border px-2 py-2",
          isActive && "border-primary bg-accent/40",
        )}
      >
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
          onClick={() => onEdit(item.id)}
        >
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{label}</div>
            <div className="truncate text-xs text-muted-foreground">
              {[showLabel, item.actionId].filter(Boolean).join(" · ")}
            </div>
          </div>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(item.id)}>
              <Pencil className="h-4 w-4" />
              {t("baseBuilder.modals.edit")}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" />
              {t("baseBuilder.modals.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
);

export const ModalsPanel = memo(() => {
  const t = useI18n("builder");
  const rootBlockId = useRootBlockId();
  const dispatchAction = useDispatchAction();
  const focusedModalId = useFocusedModalId();
  const setFocusedModalId = useSetFocusedModalId();
  const setSelectedBlockId = useSetSelectedBlockId();
  const modalDefinitions = useModalBlockDefinitions();
  const modals = usePageModals();

  const definitionsByType = useMemo(
    () => Object.fromEntries(modalDefinitions.map((def) => [def.type, def])),
    [modalDefinitions],
  );

  const editModal = useCallback(
    (blockId: string) => {
      setSelectedBlockId(blockId);
      setFocusedModalId(blockId);
    },
    [setFocusedModalId, setSelectedBlockId],
  );

  const addModal = (type: string) => {
    const definition = definitionsByType[type];
    if (!definition) return;

    const id = generateId();
    const defaults =
      typeof definition.defaultValue === "function"
        ? definition.defaultValue(t)
        : definition.defaultValue;

    dispatchAction({
      type: "add-block",
      value: {
        block: {
          id,
          type,
          data: defaults,
        },
        parentBlockId: rootBlockId,
        parentBlockProperty: "",
        index: "last",
      },
    });

    setSelectedBlockId(id);
    setFocusedModalId(id);
  };

  const deleteModal = (blockId: string) => {
    if (focusedModalId === blockId) {
      setFocusedModalId(null);
    }

    dispatchAction({
      type: "delete-block",
      value: { blockId },
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        {t("baseBuilder.modals.subtitle")}
      </p>
      {modalDefinitions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" size="sm" className="w-full">
              <Plus className="h-4 w-4" />
              {t("baseBuilder.modals.add")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width]"
          >
            {modalDefinitions.map((definition) => (
              <DropdownMenuItem
                key={definition.type}
                onClick={() => addModal(definition.type)}
              >
                {definition.icon}
                {t(definition.displayName as BuilderKeys)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {modals.length === 0 ? (
        <div className="rounded-md border border-dashed px-3 py-4 text-center">
          <p className="text-xs font-medium">
            {t("baseBuilder.modals.emptyTitle")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("baseBuilder.modals.emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {modals.map((item) => {
            const definition = definitionsByType[item.type];

            return (
              <ModalRow
                key={item.id}
                item={item}
                label={
                  definition
                    ? t(definition.displayName as BuilderKeys)
                    : item.type
                }
                icon={definition?.icon}
                isActive={focusedModalId === item.id}
                onEdit={editModal}
                onDelete={deleteModal}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});
