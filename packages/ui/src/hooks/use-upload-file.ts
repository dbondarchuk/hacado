import {
  AssetTotalSizeLimitReachedError,
  FREE_TIER_LIMITS,
  UploadedFile,
} from "@hacado/types";
import React from "react";

import { toast } from "sonner";
import { ZodError } from "zod";

import pLimit from "p-limit";

export type UseUploadFileProps = {
  onUploadComplete?: (files: UploadedFile[]) => void;
  onFileUploaded?: (file: UploadedFile) => void;
  onUploadError?: (file: File, error: unknown, errorCode?: string) => void;
} & ({ bucket?: string } | { appointmentId: string } | { customerId: string });

const uploadFilesWithProgress = ({
  file,
  description,
  bucket,
  appointmentId,
  customerId,
  onProgress,
}: {
  file: File;
  description?: string;
  bucket?: string;
  appointmentId?: string;
  customerId?: string;
  onProgress: (progress: number) => void;
}): Promise<{
  status: number;
  body: string;
}> => {
  const url = `/api/assets`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) =>
      onProgress(Math.round((e.loaded / e.total) * 100)),
    );
    xhr.addEventListener("load", () =>
      resolve({ status: xhr.status, body: xhr.responseText }),
    );
    xhr.addEventListener("error", () =>
      reject(new Error("File upload failed")),
    );
    xhr.addEventListener("abort", () =>
      reject(new Error("File upload aborted")),
    );

    xhr.open("POST", url, true);

    const formData = new FormData();
    formData.append("file", file);
    if (bucket) formData.append("bucket", bucket);
    if (description) formData.append("description", description);
    if (appointmentId) formData.append("appointmentId", appointmentId);
    if (customerId) formData.append("customerId", customerId);

    xhr.send(formData);
  });
};

export function useUploadFile({
  onUploadComplete,
  onUploadError,
  onFileUploaded,
  ...rest
}: UseUploadFileProps = {}) {
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = React.useState<File[]>([]);
  const [progress, setProgress] = React.useState<Map<string, number>>(
    new Map(),
  );
  const [isUploading, setIsUploading] = React.useState(false);

  async function uploadFile(files: { file: File; description?: string }[]) {
    setIsUploading(true);
    setUploadingFiles(files.map((file) => file.file));
    setProgress(new Map());

    const limit = pLimit(3);

    const tasks = files.map((file) =>
      limit(async () => {
        try {
          const response = await uploadFilesWithProgress({
            file: file.file,
            description: file.description,
            onProgress: (progress) => {
              setProgress((prev) => {
                prev.set(file.file.name, progress);
                return prev;
              });
            },
            ...rest,
          });

          if (response.status >= 400) {
            try {
              const parsed = JSON.parse(response.body) as {
                code?: string;
                message?: string;
                error?: unknown;
                limitBytes?: number;
              };
              if (parsed.code === "asset_total_size_limit_reached") {
                throw new AssetTotalSizeLimitReachedError(
                  parsed.limitBytes ?? FREE_TIER_LIMITS.assetsTotalSize,
                );
              }
              if (parsed.message) {
                throw new Error(parsed.message);
              }
            } catch {
              // Ignore JSON parse errors and fall back to generic message below.
            }
            throw new Error(`${response.status}: ${response.body}`);
          }

          const result = JSON.parse(response.body) as UploadedFile;

          setUploadedFiles((prev) => [...prev, result]);
          onFileUploaded?.(result);

          return result;
        } catch (error) {
          const errorMessage = getErrorMessage(error);

          const message =
            errorMessage.length > 0
              ? errorMessage
              : "Something went wrong, please try again later.";

          toast.error(message);

          const errorCode =
            error instanceof AssetTotalSizeLimitReachedError
              ? error.code
              : undefined;

          onUploadError?.(file.file, error, errorCode);
        }
      }),
    );

    try {
      const results = await Promise.all(tasks);

      onUploadComplete?.(results.filter((result) => !!result));
    } finally {
      setProgress(new Map());
      setUploadingFiles([]);

      setIsUploading(false);
    }
  }

  const averageProgress =
    progress.size > 0
      ? Math.min(
          Math.round(
            Array.from(progress.values()).reduce((a, b) => a + b, 0) /
              uploadingFiles.length,
          ),
          100,
        )
      : 0;

  return {
    isUploading,
    progress: averageProgress,
    uploadedFiles,
    uploadFile,
    uploadingFiles,
  };
}

export function getErrorMessage(err: unknown) {
  const unknownError = "Something went wrong, please try again later.";

  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => {
      return issue.message;
    });

    return errors.join("\n");
  } else if (err instanceof Error) {
    return err.message;
  } else {
    return unknownError;
  }
}

export function showErrorToast(err: unknown) {
  const errorMessage = getErrorMessage(err);

  return toast.error(errorMessage);
}
