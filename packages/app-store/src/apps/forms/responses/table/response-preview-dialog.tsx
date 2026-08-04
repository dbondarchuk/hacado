"use client";

import { useLocale } from "@timelish/i18n/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  ScrollArea,
} from "@timelish/ui";
import React from "react";
import { FormResponseListModel } from "../../models";
import { AnswerPreviewFields } from "../components/answer-preview-fields";

export const ResponsePreviewDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  response: FormResponseListModel | null;
}> = ({ open, onOpenChange, response }) => {
  const locale = useLocale();

  if (!response) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh]  max-w-2xl">
        <DialogHeader>
          <DialogTitle>{response.formName ?? response.formId}</DialogTitle>
          <DialogDescription>
            Response submitted{" "}
            {response.createdAt instanceof Date
              ? response.createdAt.toLocaleString(locale)
              : new Date(response.createdAt).toLocaleString(locale)}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <dl className="space-y-4 mt-2">
            {response.answers.map((answer) => {
              const PreviewComponent = AnswerPreviewFields[answer.type];
              if (!PreviewComponent) {
                return (
                  <div key={answer.name} className="space-y-1">
                    <dt className="text-sm font-medium">{answer.label}</dt>
                    <dd className="text-muted-foreground text-xs">
                      {answer.value !== null && answer.value !== undefined
                        ? String(answer.value)
                        : "-"}
                    </dd>
                  </div>
                );
              }
              return (
                <div key={answer.name} className="space-y-1">
                  <dt className="text-sm font-medium">{answer.label}</dt>
                  <dd className="text-xs">
                    <PreviewComponent answer={answer} locale={locale} />
                  </dd>
                </div>
              );
            })}
          </dl>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
