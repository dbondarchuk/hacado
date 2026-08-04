"use client";

import { useI18n } from "@timelish/i18n/client";
import { UploadedFile } from "@timelish/types";
import {
  Button,
  Input,
  InputGroup,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  inputVariants,
} from "@timelish/ui";
import { VariantProps } from "class-variance-authority";
import React from "react";
import { AssetSelectorDialog } from "./assets-selector-dialog";

export type AssetSelectorInputProps = {
  value?: string | null;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  accept?: string;
  fullUrl?: boolean;
  disabled?: boolean;
  disabledInput?: boolean;
  placeholder?: string;
  className?: string;
} & VariantProps<typeof inputVariants>;

export const AssetSelectorInput: React.FC<AssetSelectorInputProps> = ({
  value,
  onBlur,
  onChange,
  accept,
  placeholder,
  disabled,
  disabledInput,
  fullUrl,
  className,
  ...rest
}) => {
  const t = useI18n("ui");
  const [open, setIsOpen] = React.useState(false);

  const select = (asset: UploadedFile) => {
    onChange?.(fullUrl ? asset.url : `/assets/${asset.filename}`);
    onBlur?.();
  };

  const openDialog = () => {
    setIsOpen(true);
  };

  return (
    <InputGroup className={className}>
      <AssetSelectorDialog
        accept={accept ? [accept] : undefined}
        isOpen={open}
        close={() => setIsOpen(false)}
        onSelected={select}
      />
      <InputGroupInput>
        <Input
          disabled={disabled || disabledInput}
          placeholder={placeholder}
          {...rest}
          className={InputGroupInputClasses()}
          value={value ?? undefined}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
        />
      </InputGroupInput>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className={InputGroupAddonClasses({ h: rest.h })}
        onClick={openDialog}
      >
        {t("form.select")}
      </Button>
    </InputGroup>
  );
};
