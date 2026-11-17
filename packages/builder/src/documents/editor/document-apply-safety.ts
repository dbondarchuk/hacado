export type DocumentApplyFailure = {
  message: string;
  details: string;
};

type FailureListener = (failure: DocumentApplyFailure) => void;

let snapshot: unknown | null = null;
let pending = false;
const listeners = new Set<FailureListener>();

function serializeError(error: unknown): string {
  if (error instanceof Error) {
    return [error.name, error.message, error.stack].filter(Boolean).join("\n");
  }

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

export function beginDocumentApply(document: unknown) {
  snapshot = JSON.parse(JSON.stringify(document));
  pending = true;
}

export function commitDocumentApply() {
  snapshot = null;
  pending = false;
}

export function clearDocumentApply() {
  snapshot = null;
  pending = false;
}

export function hasPendingDocumentApply() {
  return pending && snapshot != null;
}

export function takeDocumentApplySnapshot<T = unknown>(): T | null {
  if (!snapshot) return null;

  const value = snapshot as T;
  snapshot = null;
  pending = false;
  return value;
}

export function subscribeDocumentApplyFailures(listener: FailureListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function reportDocumentApplyFailure(error: unknown) {
  const failure: DocumentApplyFailure = {
    message: "Applying AI changes failed",
    details: serializeError(error),
  };

  for (const listener of listeners) {
    listener(failure);
  }

  return failure;
}
