"use client";

import { AssetPreview } from "@hacado/ui-admin";
import { fileNameToMimeType } from "@hacado/utils";
import { FC } from "react";
import { FormsFieldType } from "../../models/fields";
import { FormAnswer } from "../../models/form";

export type AnswerPreviewProps = {
  answer: FormAnswer;
  locale?: string;
};

const formatMultiSelectValue = (
  value: string[] | null | undefined,
  locale: string = "en",
): string => {
  if (!value || !Array.isArray(value) || value.length === 0) return "-";
  try {
    return new Intl.ListFormat(locale, {
      type: "conjunction",
      style: "long",
    }).format(value);
  } catch {
    return value.join(", ");
  }
};

const CheckboxPreview: FC<AnswerPreviewProps> = ({ answer }) => (
  <span className="text-muted-foreground">
    {answer.value === true ? "Yes" : "No"}
  </span>
);

const TextPreview: FC<AnswerPreviewProps> = ({ answer }) => (
  <span className="text-muted-foreground break-words">
    {answer.value !== null && answer.value !== undefined && answer.value !== ""
      ? String(answer.value)
      : "-"}
  </span>
);

const MultiLinePreview: FC<AnswerPreviewProps> = ({ answer }) => (
  <pre className="text-muted-foreground whitespace-pre-wrap break-words ">
    {answer.value !== null && answer.value !== undefined && answer.value !== ""
      ? String(answer.value)
      : "-"}
  </pre>
);

const SelectPreview: FC<AnswerPreviewProps> = ({ answer }) => (
  <span className="text-muted-foreground">
    {answer.value !== null && answer.value !== undefined && answer.value !== ""
      ? String(answer.value)
      : "-"}
  </span>
);

const RadioPreview: FC<AnswerPreviewProps> = ({ answer }) => (
  <span className="text-muted-foreground">
    {answer.value !== null && answer.value !== undefined && answer.value !== ""
      ? String(answer.value)
      : "-"}
  </span>
);

const MultiSelectPreview: FC<AnswerPreviewProps> = ({ answer, locale }) => {
  const arr = Array.isArray(answer.value) ? answer.value : [];
  return (
    <span className="text-muted-foreground">
      {formatMultiSelectValue(arr, locale)}
    </span>
  );
};

const FilePreview: FC<AnswerPreviewProps> = ({ answer }) => {
  const value = answer.value;
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">-</span>;
  }
  const filename = String(value).replace(/^\/assets\//, "");
  const mimeType = fileNameToMimeType(filename);
  return (
    <AssetPreview
      size="md"
      asset={{
        filename,
        mimeType,
        size: 0,
        uploadedAt: new Date(),
        hash: "",
        _id: "",
        organizationId: "",
      }}
    />
  );
};

export const AnswerPreviewFields: Record<
  FormsFieldType,
  FC<AnswerPreviewProps>
> = {
  checkbox: CheckboxPreview,
  multiLine: MultiLinePreview,
  radio: RadioPreview,
  select: SelectPreview,
  multiSelect: MultiSelectPreview,
  oneLine: TextPreview,
  file: FilePreview,
  name: TextPreview,
  email: TextPreview,
  phone: TextPreview,
};
