"use client";

import type {
  BuilderDocumentSettings,
  BuilderKind,
} from "@hacado/builder-ai/client";
import type { ToolbarButtonInjection } from "@hacado/builder/builder";
import { useSelectedBlockId } from "@hacado/builder/editor";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hacado/ui/dropdown-menu";
import { ToolbarButton } from "@hacado/ui/toolbar";
import { MessageSquarePlus, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fetchBuilderAICapabilities } from "./api";
import { BuilderAIRuntime, useBuilderAI } from "./context";

function BuilderAIBlockMenu() {
  const ai = useBuilderAI();
  const selectedBlockId = useSelectedBlockId();
  const [actions, setActions] = useState<Array<{ id: string; label: string }>>(
    [],
  );

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
          (result.capabilities ?? []).map((capability) => ({
            id: capability.id,
            label: capability.label,
          })),
        );
      } catch {
        if (!cancelled) setActions([]);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [ai.builder, ai.selectedBlockType, selectedBlockId]);

  if (!selectedBlockId) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ToolbarButton type="button" tooltip="Block AI" aria-label="Block AI">
          <Sparkles className="size-4" />
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {actions.length ? (
          actions.slice(0, 8).map((action) => (
            <DropdownMenuItem
              key={action.id}
              disabled={ai.loading}
              onSelect={() => {
                void ai.runQuickAction(action.label, action.id);
              }}
            >
              {action.label}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No block actions</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            ai.openCustomInPanel();
          }}
        >
          <MessageSquarePlus className="size-4" />
          Custom instruction…
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BuilderAIDocumentMenu() {
  const ai = useBuilderAI();
  const [actions, setActions] = useState<Array<{ id: string; label: string }>>(
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetchBuilderAICapabilities({
          builder: ai.builder,
        });

        if (cancelled) return;

        setActions(
          (result.documentActions ?? []).map((action) => ({
            id: action.id,
            label: action.label,
          })),
        );
      } catch {
        if (!cancelled) setActions([]);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [ai.builder]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          type="button"
          tooltip="Document AI"
          aria-label="Document AI"
        >
          <Sparkles className="size-4" />
        </ToolbarButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {actions.length ? (
          actions.slice(0, 8).map((action) => (
            <DropdownMenuItem
              key={action.id}
              disabled={ai.loading}
              onSelect={() => {
                void ai.runQuickAction(action.label, action.id, {
                  attachSelection: false,
                });
              }}
            >
              {action.label}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No document actions</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            ai.clearAttachedBlock();
            ai.openPanel();
          }}
        >
          <MessageSquarePlus className="size-4" />
          Open AI chat…
        </DropdownMenuItem>
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
        id: "builder-ai-block",
        section: "block",
        children: <BuilderAIBlockMenu />,
      },
      {
        id: "builder-ai-document",
        section: "panels",
        position: "start",
        children: <BuilderAIDocumentMenu />,
      },
    ],
    [input.apps, input.builder, input.documentId, input.documentSettings],
  );
}
