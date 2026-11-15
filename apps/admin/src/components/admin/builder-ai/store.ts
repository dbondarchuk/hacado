"use client";

import type {
  BuilderDocumentSettings,
  BuilderKind,
  DocumentProposal,
} from "@hacado/builder-ai/client";
import { create } from "zustand";
import type { BuilderAIApplyError } from "./apply-error";
import type { AttachedBlock, BuilderAIChatMessage } from "./types";

export type BuilderAIConfig = {
  builder: BuilderKind;
  documentId?: string;
  apps?: Array<{ appId: string; appName: string }>;
  documentSettings?: BuilderDocumentSettings;
};

type OpenPanelFn = () => void;
type ApplyDocumentSettingsFn = (
  patch: Partial<BuilderDocumentSettings>,
) => void;

type BuilderAIStore = {
  config: BuilderAIConfig | null;
  loading: boolean;
  progressSteps: string[];
  messages: BuilderAIChatMessage[];
  draft: string;
  attachedBlock: AttachedBlock | null;
  conversationId?: string;
  applyError: BuilderAIApplyError | null;
  openPanelFn: OpenPanelFn | null;
  applyDocumentSettingsFn: ApplyDocumentSettingsFn | null;
  setConfig: (config: BuilderAIConfig) => void;
  setLoading: (loading: boolean) => void;
  setProgressSteps: (steps: string[]) => void;
  setMessages: (
    updater:
      | BuilderAIChatMessage[]
      | ((current: BuilderAIChatMessage[]) => BuilderAIChatMessage[]),
  ) => void;
  setDraft: (draft: string) => void;
  setAttachedBlock: (block: AttachedBlock | null) => void;
  setConversationId: (id: string | undefined) => void;
  setApplyError: (error: BuilderAIApplyError | null) => void;
  clearApplyError: () => void;
  registerOpenPanel: (fn: OpenPanelFn) => () => void;
  openPanel: () => void;
  registerApplyDocumentSettings: (fn: ApplyDocumentSettingsFn) => () => void;
  applyDocumentSettings: (patch: Partial<BuilderDocumentSettings>) => void;
  resetConversation: () => void;
  appendMessage: (message: BuilderAIChatMessage) => void;
  updateMessage: (
    messageId: string,
    patch: Partial<BuilderAIChatMessage>,
  ) => void;
  discardProposal: (messageId: string) => void;
};

export const useBuilderAIStore = create<BuilderAIStore>((set, get) => ({
  config: null,
  loading: false,
  progressSteps: [],
  messages: [],
  draft: "",
  attachedBlock: null,
  conversationId: undefined,
  applyError: null,
  openPanelFn: null,
  applyDocumentSettingsFn: null,
  setConfig: (config) => {
    const prev = get().config;
    const documentChanged =
      !prev ||
      prev.builder !== config.builder ||
      prev.documentId !== config.documentId;

    set({
      config,
      ...(documentChanged
        ? {
            messages: [],
            conversationId: undefined,
            draft: "",
            attachedBlock: null,
            applyError: null,
            progressSteps: [],
            loading: false,
          }
        : {}),
    });
  },
  setLoading: (loading) => set({ loading }),
  setProgressSteps: (progressSteps) => set({ progressSteps }),
  setMessages: (updater) =>
    set((state) => ({
      messages:
        typeof updater === "function" ? updater(state.messages) : updater,
    })),
  setDraft: (draft) => set({ draft }),
  setAttachedBlock: (attachedBlock) => set({ attachedBlock }),
  setConversationId: (conversationId) => set({ conversationId }),
  setApplyError: (applyError) => set({ applyError }),
  clearApplyError: () => set({ applyError: null }),
  registerOpenPanel: (fn) => {
    set({ openPanelFn: fn });

    return () => {
      if (get().openPanelFn === fn) {
        set({ openPanelFn: null });
      }
    };
  },
  openPanel: () => {
    get().openPanelFn?.();
  },
  registerApplyDocumentSettings: (fn) => {
    set({ applyDocumentSettingsFn: fn });

    return () => {
      if (get().applyDocumentSettingsFn === fn) {
        set({ applyDocumentSettingsFn: null });
      }
    };
  },
  applyDocumentSettings: (patch) => {
    get().applyDocumentSettingsFn?.(patch);
  },
  resetConversation: () =>
    set({
      messages: [],
      conversationId: undefined,
      draft: "",
      applyError: null,
      progressSteps: [],
      loading: false,
    }),
  appendMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (messageId, patch) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === messageId ? { ...message, ...patch } : message,
      ),
    })),
  discardProposal: (messageId) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === messageId
          ? {
              ...message,
              proposal: null,
              settingsProposal: null,
              pendingSlug: null,
            }
          : message,
      ),
    })),
}));

export type { DocumentProposal };
