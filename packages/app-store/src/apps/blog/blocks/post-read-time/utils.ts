const extractTextFromNode = (node: unknown): string => {
  if (!node || typeof node !== "object") return "";

  const n = node as Record<string, unknown>;
  if (typeof n.text === "string") return n.text;
  if (Array.isArray(n.children)) {
    return n.children.map(extractTextFromNode).join(" ");
  }

  return "";
};

export const extractTextFromPlateContent = (content: unknown): string => {
  if (!content) return "";
  if (Array.isArray(content)) {
    return content.map(extractTextFromNode).join(" ").trim();
  }

  return extractTextFromNode(content).trim();
};

export const countWords = (text: string): number => {
  if (!text) return 0;

  return text.split(/\s+/).filter(Boolean).length;
};

export const calculateReadingTimeMinutes = (
  content: unknown,
  wordsPerMinute: number,
): number => {
  const wordCount = countWords(extractTextFromPlateContent(content));
  if (wordCount === 0) return 1;

  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};
