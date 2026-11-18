const textEncoder = new TextEncoder();

/** Encode one SSE frame (`event` + JSON `data`). */
export function encodeSse(event: string, data?: unknown): Uint8Array {
  const payload = data === undefined ? "null" : JSON.stringify(data);
  return textEncoder.encode(`event: ${event}\ndata: ${payload}\n\n`);
}

export type SseFrame = {
  event: string;
  data: string;
};

/**
 * Parse complete SSE frames from a buffer. Returns remaining incomplete text.
 */
export function parseSseChunk(buffer: string): {
  events: SseFrame[];
  rest: string;
} {
  const events: SseFrame[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    if (!part.trim()) continue;

    let event = "message";
    const dataLines: string[] = [];

    for (const line of part.split("\n")) {
      if (line.startsWith("event:")) {
        event = line.slice("event:".length).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice("data:".length).trimStart());
      }
    }

    if (dataLines.length) {
      events.push({ event, data: dataLines.join("\n") });
    }
  }

  return { events, rest };
}

export function wantsEventStream(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false;

  return acceptHeader
    .split(",")
    .some((part) => part.trim().toLowerCase().startsWith("text/event-stream"));
}
