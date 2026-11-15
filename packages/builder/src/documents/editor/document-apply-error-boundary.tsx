"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import {
  hasPendingDocumentApply,
  reportDocumentApplyFailure,
  takeDocumentApplySnapshot,
} from "./document-apply-safety";

type Props = {
  children: ReactNode;
  onRollback: (document: unknown) => void;
};

type State = {
  nonce: number;
  error: Error | null;
  recoveredFromApply: boolean;
};

/**
 * Catches render errors caused by a just-applied document mutation, rolls back
 * to the pre-apply snapshot, and notifies subscribers (e.g. Builder AI chat).
 */
export class DocumentApplyErrorBoundary extends Component<Props, State> {
  state: State = { nonce: 0, error: null, recoveredFromApply: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error, recoveredFromApply: false };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    if (!hasPendingDocumentApply()) {
      return;
    }

    const snapshot = takeDocumentApplySnapshot();

    if (snapshot) {
      this.props.onRollback(snapshot);
    }

    reportDocumentApplyFailure(error);
    this.setState((state) => ({
      nonce: state.nonce + 1,
      error: null,
      recoveredFromApply: true,
    }));
  }

  render() {
    if (this.state.error) {
      return (
        <div className="text-destructive flex h-full flex-col items-start justify-center gap-2 p-6 text-sm">
          <div className="font-medium">
            Something went wrong rendering the document.
          </div>
          <pre className="bg-muted text-foreground max-h-40 max-w-full overflow-auto rounded-md p-2 text-xs whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={() =>
              this.setState((state) => ({
                error: null,
                nonce: state.nonce + 1,
                recoveredFromApply: false,
              }))
            }
          >
            Try again
          </button>
        </div>
      );
    }

    return <div key={this.state.nonce}>{this.props.children}</div>;
  }
}
