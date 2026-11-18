import type { AIToolDefinition } from "@hacado/ai-core";
import type { IServicesContainer } from "@hacado/types/services";
import type { SessionUser } from "@hacado/types/users";

export type AIToolsJobTool = {
  definition: AIToolDefinition;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
};

export type CreateAIToolsSessionOptions = {
  consumer: string;
  services: IServicesContainer;
  user?: SessionUser;
  signal?: AbortSignal;
  jobTools?: AIToolsJobTool[];
};

export type AIToolsSession = {
  definitions: AIToolDefinition[];
  execute(name: string, args: Record<string, unknown>): Promise<unknown>;
};
