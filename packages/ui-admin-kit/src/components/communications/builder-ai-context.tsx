"use client";

import { createContext, useContext } from "react";
import type { ControllerRenderProps } from "react-hook-form";

export type CommunicationEmailBuilderAIProps = {
  args: Record<string, any>;
  value: any;
  onChange: (value: any) => void;
  onIsValidChange: (isValid: boolean) => void;
  subject?: string | null;
  onSubjectChange: (subject: string) => void;
  contentKey?: string;
};

export type CommunicationTextMessageBuilderAIProps = {
  args: Record<string, any>;
  field: ControllerRenderProps<any, "content">;
};

export type CommunicationBuilderAIAdapters = {
  EmailBuilder?: React.ComponentType<CommunicationEmailBuilderAIProps>;
  TextMessageBuilder?: React.ComponentType<CommunicationTextMessageBuilderAIProps>;
};

const CommunicationBuilderAIContext =
  createContext<CommunicationBuilderAIAdapters>({});

export const CommunicationBuilderAIProvider = ({
  children,
  value,
}: {
  children: React.ReactNode;
  value: CommunicationBuilderAIAdapters;
}) => {
  return (
    <CommunicationBuilderAIContext.Provider value={value}>
      {children}
    </CommunicationBuilderAIContext.Provider>
  );
};

export const useCommunicationBuilderAI = () =>
  useContext(CommunicationBuilderAIContext);
