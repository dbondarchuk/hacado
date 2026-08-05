"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@hacado/ui";
import { RadioReceiver } from "lucide-react";
import React from "react";

export type AppEventSubscriptionsDialogProps = {
  patterns: string[];
  triggerLabel: string;
  title: string;
  description: string;
};

/**
 * Lists {@link import("@hacado/types").App}'s `subscribeTo` patterns in a modal (store app detail).
 */
export const AppEventSubscriptionsDialog: React.FC<
  AppEventSubscriptionsDialogProps
> = ({ patterns, triggerLabel, title, description }) => {
  if (!patterns.length) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          type="button"
          className="gap-2 font-normal"
        >
          <RadioReceiver className="h-4 w-4 shrink-0" aria-hidden />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ul className="rounded-md border bg-muted/40 px-4 py-3 font-mono text-base leading-relaxed">
          {patterns.map((pattern) => (
            <li key={pattern} className="break-all py-1">
              {pattern}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
};
