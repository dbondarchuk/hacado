"use client";

import type { BuilderDocumentSettings } from "@hacado/ai-builder-core/client";
import { generateId } from "@hacado/builder/helpers";
import { EmailBuilder } from "@hacado/email-builder";
import { EmailLayoutDefaultProps } from "@hacado/email-builder/blocks/defaults";
import {
  CommunicationBuilderAIProvider,
  type CommunicationEmailBuilderAIProps,
  type CommunicationTextMessageBuilderAIProps,
} from "@hacado/ui-admin-kit/communications";
import { TextMessageBuilder } from "@hacado/ui-admin-kit/templates";
import { Sparkles } from "lucide-react";
import { useEffect, useMemo } from "react";
import { BuilderAIAssistantPanel } from "./assistant-panel";
import { useBuilderAIHostLifecycle } from "./host-lifecycle";
import { useBuilderAIStore } from "./store";
import { TextMessageAIChrome } from "./text-message-ai";
import { useBuilderAIToolbarButtons } from "./toolbar";
import { BUILDER_AI_TAB } from "./types";

function createEmptyEmailDocument() {
  return {
    type: "EmailLayout" as const,
    id: generateId(),
    data: {
      ...EmailLayoutDefaultProps,
      children: [] as unknown[],
    },
  };
}

function SendCommunicationEmailBuilder(
  props: CommunicationEmailBuilderAIProps,
) {
  useBuilderAIHostLifecycle();

  const documentSettings = useMemo<BuilderDocumentSettings>(
    () => ({
      subject: props.subject ?? "",
    }),
    [props.subject],
  );

  // Fresh empty root per mount/template load - never reuse the email-builder
  // module singleton RootBlock (shared mutable reference).
  const emptyDocument = useMemo(
    () => createEmptyEmailDocument(),
    [props.contentKey],
  );

  const editorValue = props.value ?? emptyDocument;

  useEffect(() => {
    return useBuilderAIStore
      .getState()
      .registerApplyDocumentSettings((patch) => {
        if (patch.subject === undefined) return;

        props.onSubjectChange(String(patch.subject ?? ""));
      });
  }, [props.onSubjectChange]);

  const toolbarButtons = useBuilderAIToolbarButtons({
    builder: "email",
    documentSettings,
  });

  const extraTabs = useMemo(
    () => [
      {
        value: BUILDER_AI_TAB,
        label: "AI",
        icon: <Sparkles size={16} />,
        content: <BuilderAIAssistantPanel />,
      },
    ],
    [],
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <EmailBuilder
        key={props.contentKey ?? "email-composer"}
        args={props.args}
        value={editorValue}
        onChange={props.onChange}
        onIsValidChange={props.onIsValidChange}
        toolbarButtons={toolbarButtons}
        extraTabs={extraTabs}
      />
    </div>
  );
}

function SendCommunicationTextMessageBuilder(
  props: CommunicationTextMessageBuilderAIProps,
) {
  useBuilderAIHostLifecycle();

  const { field, args } = props;
  const onContentChange = field.onChange;

  const documentSettings = useMemo<BuilderDocumentSettings>(
    () => ({
      value: String(field.value ?? ""),
    }),
    [field.value],
  );

  useEffect(() => {
    return useBuilderAIStore
      .getState()
      .registerApplyDocumentSettings((patch) => {
        if (patch.value === undefined) return;

        onContentChange(patch.value);
      });
  }, [onContentChange]);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden">
      <TextMessageAIChrome args={args} documentSettings={documentSettings}>
        {(toolbar) => (
          <TextMessageBuilder args={args} field={field} toolbar={toolbar} />
        )}
      </TextMessageAIChrome>
    </div>
  );
}

const adapters = {
  EmailBuilder: SendCommunicationEmailBuilder,
  TextMessageBuilder: SendCommunicationTextMessageBuilder,
};

export function SendCommunicationBuilderAIProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CommunicationBuilderAIProvider value={adapters}>
      {children}
    </CommunicationBuilderAIProvider>
  );
}
