"use client";

import { useI18n } from "@timelish/i18n/client";
import { mimeTypeToExtension } from "@timelish/utils";
import React, { InputHTMLAttributes } from "react";
import { Accept, useDropzone } from "react-dropzone";
import { DefaultExtensionType, defaultStyles, FileIcon } from "react-file-icon";
import { cn } from "../utils";

export type DndFileInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "accept"
> & {
  value?: File[];
  onChange?: (value: File[]) => void;
  accept?: Accept;
  maxFiles?: number;
};

export const DndFileInput: React.FC<DndFileInputProps> = ({
  accept,
  value,
  onChange,
  maxFiles = 1,
  ...rest
}) => {
  const t = useI18n("ui");
  const onDrop = React.useCallback(
    (droppedFiles: File[]) => {
      onChange?.(droppedFiles || []);
    },
    [onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    maxFiles,
    onDrop,
    accept: accept,
  });

  return (
    <div {...getRootProps()}>
      <input
        type="file"
        {...rest}
        className="focus:shadow-outline w-full appearance-none rounded border
py-2 px-3 leading-tight text-background shadow focus:outline-none"
        {...getInputProps()}
      />
      <div
        className={cn(
          "w-full border border-dashed border-primary rounded-md p-2 text-muted-foreground cursor-pointer",
          isDragActive && "bg-primary/20",
        )}
      >
        {isDragActive ? (
          <p className="my-2 text-center">{t("dndFileInput.dropFilesHere")}</p>
        ) : (
          <p className="my-2 text-center">
            {t("dndFileInput.dragAndDropOrClick")}
          </p>
        )}
        {!!value && (
          <div className="mt-2 flex justify-center flex-row gap-2">
            {value.map((file) => (
              <div key={file.name}>
                {file.type?.startsWith("image") ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full object-contain max-h-[30vh]"
                  />
                ) : (
                  <div className="flex flex-col gap-2 text-base justify-center">
                    <div className="max-w-10 flex self-center">
                      <FileIcon
                        extension={file.name.substring(
                          file.name.lastIndexOf(".") + 1,
                        )}
                        {...defaultStyles[
                          mimeTypeToExtension(file.type) as DefaultExtensionType
                        ]}
                      />
                    </div>
                    <div className="text-muted-foreground text-center">
                      {file.name.substring(file.name.lastIndexOf("/") + 1)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
