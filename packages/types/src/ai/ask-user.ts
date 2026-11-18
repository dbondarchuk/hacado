export type AskUserKind = "clarification" | "confirmation" | "preference";

export type AskUserOption = {
  label: string;
  value: string;
};

export type AskUserRequest = {
  question: string;
  reason: string;
  required: boolean;
  kind: AskUserKind;
  options?: AskUserOption[];
  allowCustomAnswer?: boolean;
};
