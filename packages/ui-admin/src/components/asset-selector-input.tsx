"use client";

import { useI18n } from "@hacado/i18n/client";
import { UploadedFile } from "@hacado/types";
import {
  Button,
  Input,
  InputGroup,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  inputVariants,
  toast,
} from "@hacado/ui";
import {
  FAVICON_MIN_SIZE,
  isSvgFaviconSource,
  probeImageDimensions,
  type FaviconConstraintErrorCode,
} from "@hacado/utils";
import { VariantProps } from "class-variance-authority";
import React from "react";
import { AssetSelectorDialog } from "./assets-selector-dialog";

export type AssetImageConstraints = {
  square?: boolean;
  minSize?: number;
};

export type AssetSelectorInputProps = {
  value?: string | null;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  accept?: string;
  fullUrl?: boolean;
  onlyAssets?: boolean;
  disabled?: boolean;
  disabledInput?: boolean;
  placeholder?: string;
  className?: string;
  imageConstraints?: AssetImageConstraints;
  onConstraintError?: (code: FaviconConstraintErrorCode) => void;
} & VariantProps<typeof inputVariants>;

const isAbsoluteUrl = (url: string) => /^https?:\/\//i.test(url);

function parseAcceptList(accept?: string): string[] | undefined {
  if (!accept) {
    return undefined;
  }

  const parts = accept
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length ? parts : undefined;
}

export const AssetSelectorInput: React.FC<AssetSelectorInputProps> = ({
  value,
  onBlur,
  onChange,
  accept,
  placeholder,
  disabled,
  disabledInput,
  fullUrl,
  onlyAssets,
  className,
  imageConstraints,
  onConstraintError,
  ...rest
}) => {
  const t = useI18n("ui");
  const [open, setIsOpen] = React.useState(false);

  const reportConstraintError = (code: FaviconConstraintErrorCode) => {
    toast.error(
      t(`assetSelector.constraintErrors.${code}`, {
        minSize: imageConstraints?.minSize ?? FAVICON_MIN_SIZE,
      }),
    );

    onConstraintError?.(code);
  };

  const validateCandidate = async (candidate: {
    url: string;
    mimeType?: string | null;
    filename?: string | null;
  }): Promise<boolean> => {
    if (!imageConstraints?.square && imageConstraints?.minSize == null) {
      return true;
    }

    if (
      isSvgFaviconSource({
        url: candidate.url,
        mimeType: candidate.mimeType,
        filename: candidate.filename,
      })
    ) {
      return true;
    }

    const dimensions = await probeImageDimensions(candidate.url);
    if (!dimensions) {
      reportConstraintError("unreadable");
      return false;
    }

    if (imageConstraints.square && dimensions.width !== dimensions.height) {
      reportConstraintError("not_square");
      return false;
    }

    const minSize = imageConstraints.minSize;
    if (
      minSize != null &&
      Math.min(dimensions.width, dimensions.height) < minSize
    ) {
      reportConstraintError("too_small");
      return false;
    }

    return true;
  };

  const select = async (asset: UploadedFile) => {
    const nextValue =
      fullUrl || isAbsoluteUrl(asset.url)
        ? asset.url
        : `/assets/${asset.filename}`;

    const ok = await validateCandidate({
      url: nextValue,
      mimeType: asset.mimeType,
      filename: asset.filename,
    });
    if (!ok) {
      return;
    }

    onChange?.(nextValue);
    onBlur?.();
  };

  const handleBlur = async () => {
    const current = value?.trim();
    if (
      current &&
      (imageConstraints?.square || imageConstraints?.minSize != null)
    ) {
      await validateCandidate({ url: current });
    }

    onBlur?.();
  };

  return (
    <InputGroup className={className}>
      <AssetSelectorDialog
        accept={parseAcceptList(accept)}
        onlyAssets={onlyAssets}
        isOpen={open}
        close={() => setIsOpen(false)}
        onSelected={(asset) => {
          void select(asset);
        }}
      />
      <InputGroupInput>
        <Input
          disabled={disabled || disabledInput}
          placeholder={placeholder}
          {...rest}
          className={InputGroupInputClasses()}
          value={value ?? undefined}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={() => {
            void handleBlur();
          }}
        />
      </InputGroupInput>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className={InputGroupAddonClasses({ h: rest.h })}
        onClick={() => setIsOpen(true)}
      >
        {t("form.select")}
      </Button>
    </InputGroup>
  );
};
