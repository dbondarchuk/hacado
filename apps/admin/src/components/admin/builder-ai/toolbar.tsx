"use client";

import type {
  BlockAICapability,
  BuilderDocumentSettings,
  BuilderKind,
} from "@hacado/ai-builder-core/client";
import type { ToolbarButtonInjection } from "@hacado/builder/builder";
import { useSelectedBlockId } from "@hacado/builder/editor";
import type { AllKeys } from "@hacado/i18n";
import { useI18n } from "@hacado/i18n/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@hacado/ui/dropdown-menu";
import { ToolbarButton } from "@hacado/ui/toolbar";
import { MessageSquarePlus, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  fetchBuilderAICapabilities,
  type BuilderAIDocumentAction,
} from "./api";
import { BuilderAIRuntime, useBuilderAI } from "./context";

type ResolvedAction = {
  id: string;
  label: string;
  message: string;
  options?: Array<{ id: string; label: string; message: string }>;
};

type I18nT = ReturnType<typeof useI18n>;

function resolveActionLabel(
  t: I18nT,
  action: { labelKey: AllKeys; label?: string },
): string {
  if (t.has(action.labelKey)) {
    return String(t(action.labelKey));
  }

  return action.label || action.labelKey;
}

function mapCapability(
  t: I18nT,
  capability: BlockAICapability,
): ResolvedAction {
  const label = resolveActionLabel(t, capability);

  return {
    id: capability.id,
    label,
    message: capability.label || label,
    options: capability.options?.map((option) => {
      const optionLabel = resolveActionLabel(t, option);

      return {
        id: option.id,
        label: optionLabel,
        message: option.message || option.label || optionLabel,
      };
    }),
  };
}

function mapDocumentAction(
  t: I18nT,
  action: BuilderAIDocumentAction,
): ResolvedAction {
  const label = resolveActionLabel(t, action);

  return {
    id: action.id,
    label,
    message: action.label || label,
  };
}

function BuilderAIActionItems({
  actions,
  emptyLabel,
  disabled,
  onSelect,
}: {
  actions: ResolvedAction[];
  emptyLabel: string;
  disabled?: boolean;
  onSelect: (
    action: ResolvedAction,
    optionId?: string,
    message?: string,
  ) => void;
}) {
  if (!actions.length) {
    return <DropdownMenuItem disabled>{emptyLabel}</DropdownMenuItem>;
  }

  return (
    <>
      {actions.slice(0, 8).map((action) => {
        if (action.options?.length) {
          return (
            <DropdownMenuSub key={action.id}>
              <DropdownMenuSubTrigger disabled={disabled}>
                {action.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-52">
                {action.options.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    disabled={disabled}
                    onSelect={() => {
                      onSelect(action, option.id, option.message);
                    }}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        }

        return (
          <DropdownMenuItem
            key={action.id}
            disabled={disabled}
            onSelect={() => {
              onSelect(action);
            }}
          >
            {action.label}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}

function useBlockAIActions() {
  const ai = useBuilderAI();
  const t = useI18n();
  const selectedBlockId = useSelectedBlockId();
  const [actions, setActions] = useState<ResolvedAction[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!selectedBlockId || !ai.selectedBlockType) {
        setActions([]);
        return;
      }

      try {
        const result = await fetchBuilderAICapabilities({
          builder: ai.builder,
          blockType: ai.selectedBlockType,
        });

        if (cancelled) return;

        setActions(
          (result.capabilities ?? []).map((capability) =>
            mapCapability(t, capability),
          ),
        );
      } catch {
        if (!cancelled) setActions([]);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [ai.builder, ai.selectedBlockType, selectedBlockId, t]);

  return { actions, selectedBlockId };
}

function useDocumentAIActions() {
  const ai = useBuilderAI();
  const t = useI18n();
  const [actions, setActions] = useState<ResolvedAction[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetchBuilderAICapabilities({
          builder: ai.builder,
        });

        if (cancelled) return;

        setActions(
          (result.documentActions ?? []).map((action) =>
            mapDocumentAction(t, action),
          ),
        );
      } catch {
        if (!cancelled) setActions([]);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [ai.builder, t]);

  return actions;
}

/** Block-only AI menu for the floating selection toolbar. */
export function BuilderAIBlockMenu() {
  const ai = useBuilderAI();
  const t = useI18n();
  const { actions, selectedBlockId } = useBlockAIActions();

  if (!selectedBlockId) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          type="button"
          tooltip={t("builder.ai.blockAi")}
          aria-label={t("builder.ai.blockAi")}
        >
          <Sparkles className="size-4" />
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <BuilderAIActionItems
          actions={actions}
          emptyLabel={t("builder.ai.noBlockActions")}
          disabled={ai.loading}
          onSelect={(action, optionId, message) => {
            void ai.runQuickAction(
              message ?? action.message,
              optionId ?? action.id,
            );
          }}
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            ai.openCustomInPanel();
          }}
        >
          <MessageSquarePlus className="size-4" />
          {t("builder.ai.customInstruction")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Combined Block + Document AI menu for the main builder toolbar. */
function BuilderAIMenu() {
  const ai = useBuilderAI();
  const t = useI18n();
  const { actions: blockActions, selectedBlockId } = useBlockAIActions();
  const documentActions = useDocumentAIActions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          type="button"
          tooltip={t("builder.ai.documentAi")}
          aria-label={t("builder.ai.documentAi")}
        >
          <Sparkles className="size-4" />
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup label={t("builder.ai.blockSection")}>
          {selectedBlockId ? (
            <>
              <BuilderAIActionItems
                actions={blockActions}
                emptyLabel={t("builder.ai.noBlockActions")}
                disabled={ai.loading}
                onSelect={(action, optionId, message) => {
                  void ai.runQuickAction(
                    message ?? action.message,
                    optionId ?? action.id,
                  );
                }}
              />
              <DropdownMenuItem
                onSelect={() => {
                  ai.openCustomInPanel();
                }}
              >
                <MessageSquarePlus className="size-4" />
                {t("builder.ai.customInstruction")}
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem disabled>
              {t("builder.ai.noBlockSelected")}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuGroup label={t("builder.ai.documentSection")}>
          <BuilderAIActionItems
            actions={documentActions}
            emptyLabel={t("builder.ai.blockActions.noDocumentActions")}
            disabled={ai.loading}
            onSelect={(action) => {
              void ai.runQuickAction(action.message, action.id, {
                attachSelection: false,
              });
            }}
          />
          <DropdownMenuItem
            onSelect={() => {
              ai.clearAttachedBlock();
              ai.openPanel();
            }}
          >
            <MessageSquarePlus className="size-4" />
            {t("builder.ai.blockActions.openChat")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function useBuilderAIToolbarButtons(input: {
  builder: BuilderKind;
  documentId?: string;
  apps?: Array<{ appId: string; appName: string }>;
  documentSettings?: BuilderDocumentSettings;
}): ToolbarButtonInjection[] {
  return useMemo(
    () => [
      {
        id: "builder-ai-runtime",
        section: "panels",
        position: "start",
        children: (
          <BuilderAIRuntime
            builder={input.builder}
            documentId={input.documentId}
            apps={input.apps}
            documentSettings={input.documentSettings}
          />
        ),
      },
      {
        id: "builder-ai-menu",
        section: "panels",
        position: "start",
        children: <BuilderAIMenu />,
      },
      {
        id: "builder-ai-selection",
        section: "selection",
        position: "start",
        children: <BuilderAIBlockMenu />,
      },
    ],
    [input.apps, input.builder, input.documentId, input.documentSettings],
  );
}
