import type { AIToolDefinition } from "@hacado/ai-core";
import { getLoggerFactory } from "@hacado/logger";
import type { AppAIToolDefinition, IAIToolsProvider } from "@hacado/types/apps";
import { PLATFORM_AI_TOOL_DEFINITIONS } from "./platform/definitions";
import { executePlatformTool } from "./platform/execute";
import type { AIToolsSession, CreateAIToolsSessionOptions } from "./types";

/** Provider tool names must match ^[a-zA-Z0-9_-]+$ (no dots). */
function prefixAppToolName(appId: string, toolName: string): string {
  return `app_${appId}__${toolName}`;
}

function parseAppToolName(
  name: string,
): { appId: string; toolName: string } | null {
  if (!name.startsWith("app_")) return null;

  const rest = name.slice("app_".length);
  const sep = rest.indexOf("__");
  if (sep <= 0 || sep === rest.length - 2) return null;

  return {
    appId: rest.slice(0, sep),
    toolName: rest.slice(sep + 2),
  };
}

function argKeys(args: Record<string, unknown>): string[] {
  return Object.keys(args);
}

export async function createAIToolsSession(
  options: CreateAIToolsSessionOptions,
): Promise<AIToolsSession> {
  const logger = getLoggerFactory("ai-tools")("createAIToolsSession");
  const { services, jobTools = [], signal, consumer } = options;

  logger.debug({ consumer }, "Creating AI tools session");

  const definitions: AIToolDefinition[] = [...PLATFORM_AI_TOOL_DEFINITIONS];
  const appExecutors = new Map<
    string,
    {
      appId: string;
      appName: string;
      toolName: string;
      execute: (args: Record<string, unknown>) => Promise<unknown>;
    }
  >();

  const jobExecutors = new Map<
    string,
    (args: Record<string, unknown>) => Promise<unknown>
  >();

  for (const jobTool of jobTools) {
    definitions.push(jobTool.definition);
    jobExecutors.set(jobTool.definition.name, jobTool.execute);
  }

  const discoveredApps: Array<{
    appId: string;
    appName: string;
    tools: string[];
  }> = [];

  await services.connectedAppsService.invokeAppsByScope<IAIToolsProvider, void>(
    "ai-tools-provider",
    async (app, service) => {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      if (
        typeof service.listAITools !== "function" ||
        typeof service.executeAITool !== "function"
      ) {
        logger.warn(
          { appId: app._id, appName: app.name },
          "App declares ai-tools-provider but missing methods",
        );

        return;
      }

      const tools: AppAIToolDefinition[] = await service.listAITools(app);
      const registered: string[] = [];

      for (const tool of tools) {
        const fullName = prefixAppToolName(String(app._id), tool.name);
        definitions.push({
          name: fullName,
          description: tool.description,
          inputSchema: tool.inputSchema,
          ui: tool.ui,
        });

        appExecutors.set(fullName, {
          appId: String(app._id),
          appName: app.name,
          toolName: tool.name,
          execute: (args) => service.executeAITool(app, tool.name, args),
        });

        registered.push(fullName);
      }

      discoveredApps.push({
        appId: String(app._id),
        appName: app.name,
        tools: registered,
      });

      logger.debug(
        {
          appId: app._id,
          appName: app.name,
          tools: registered,
        },
        "Registered app AI tools",
      );
    },
    { ignoreErrors: true },
  );

  logger.debug(
    {
      consumer,
      platform: PLATFORM_AI_TOOL_DEFINITIONS.length,
      job: jobTools.length,
      app: appExecutors.size,
      total: definitions.length,
      toolNames: definitions.map((definition) => definition.name),
      apps: discoveredApps,
    },
    "AI tools session ready",
  );

  return {
    definitions,
    async execute(name: string, args: Record<string, unknown>) {
      const executeLogger = getLoggerFactory("ai-tools")("execute");
      const started = Date.now();

      if (signal?.aborted) {
        executeLogger.warn({ tool: name }, "Tool execute aborted before start");
        throw new DOMException("Aborted", "AbortError");
      }

      executeLogger.debug(
        { tool: name, argKeys: argKeys(args) },
        "Executing tool",
      );

      try {
        let result: unknown;

        if (name.startsWith("platform_")) {
          result = await executePlatformTool(name, args, services);
        } else {
          const jobExecute = jobExecutors.get(name);
          if (jobExecute) {
            result = await jobExecute(args);
          } else {
            const appEntry = appExecutors.get(name);
            if (appEntry) {
              result = await appEntry.execute(args);
            } else {
              const parsed = parseAppToolName(name);
              result = parsed
                ? { error: `Unknown app tool: ${name}` }
                : { error: `Unknown tool: ${name}` };
            }
          }
        }

        executeLogger.debug(
          {
            tool: name,
            durationMs: Date.now() - started,
            hasError:
              Boolean(result) &&
              typeof result === "object" &&
              "error" in (result as object),
          },
          "Tool execute completed",
        );

        return result;
      } catch (error) {
        executeLogger.error(
          { err: error, tool: name, durationMs: Date.now() - started },
          "Tool execute failed",
        );

        throw error;
      }
    },
  };
}
