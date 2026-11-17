import type { AIMessage, AIToolCall, GenerateInput } from "../types";

/**
 * Split messages for AI SDK `instructions` + `messages`.
 *
 * Only the **first** system message becomes stable `instructions` (cacheable
 * prefix). Later system messages are treated as volatile context and moved
 * into the conversation as user turns so they do not bust the cache prefix.
 */
export function splitInstructionsAndMessages(messages: AIMessage[]): {
  instructions?: string;
  messages: ReturnType<typeof toModelMessages>;
} {
  let instructions: string | undefined;
  const conversation: AIMessage[] = [];

  for (const message of messages) {
    if (message.role === "system") {
      const content = message.content.trim();

      if (!instructions) {
        instructions = content || undefined;
        continue;
      }

      if (content) {
        conversation.push({ role: "user", content });
      }

      continue;
    }

    conversation.push(message);
  }

  return {
    instructions: instructions || undefined,
    messages: toModelMessages(conversation),
  };
}

function toToolResultOutput(content: string) {
  try {
    return {
      type: "json" as const,
      value: JSON.parse(content) as unknown,
    };
  } catch {
    return {
      type: "text" as const,
      value: content,
    };
  }
}

function toAssistantContent(message: AIMessage) {
  const toolCalls = message.toolCalls ?? [];

  if (!toolCalls.length) {
    return message.content;
  }

  const parts: Array<
    | { type: "text"; text: string }
    | {
        type: "tool-call";
        toolCallId: string;
        toolName: string;
        input: Record<string, unknown>;
      }
  > = [];

  if (message.content) {
    parts.push({ type: "text", text: message.content });
  }

  for (const call of toolCalls) {
    parts.push(toToolCallPart(call));
  }

  return parts;
}

function toToolCallPart(call: AIToolCall) {
  return {
    type: "tool-call" as const,
    toolCallId: call.id,
    toolName: call.name,
    input: call.arguments,
  };
}

function toModelMessages(messages: GenerateInput["messages"]) {
  return messages.map((message) => {
    if (message.role === "tool") {
      return {
        role: "tool" as const,
        content: [
          {
            type: "tool-result" as const,
            toolCallId: message.toolCallId ?? "unknown",
            toolName: message.name ?? "unknown",
            output: toToolResultOutput(message.content),
          },
        ],
      };
    }

    if (message.role === "assistant") {
      return {
        role: "assistant" as const,
        content: toAssistantContent(message),
      };
    }

    return {
      role: message.role,
      content: message.content,
    };
  }) as any;
}
