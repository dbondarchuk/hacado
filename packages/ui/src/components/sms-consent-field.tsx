"use client";

import React from "react";
import { Checkbox } from "./checkbox";

const linkClassName = "underline underline-offset-2";

export const smsPolicyRichTags = {
  terms: (chunks: React.ReactNode) => (
    <a
      className={linkClassName}
      href="https://hacado.com/terms"
      target="_blank"
      rel="noreferrer"
    >
      {chunks}
    </a>
  ),
  privacy: (chunks: React.ReactNode) => (
    <a
      className={linkClassName}
      href="https://hacado.com/privacy"
      target="_blank"
      rel="noreferrer"
    >
      {chunks}
    </a>
  ),
  sms: (chunks: React.ReactNode) => (
    <a
      className={linkClassName}
      href="https://hacado.com/sms-policy"
      target="_blank"
      rel="noreferrer"
    >
      {chunks}
    </a>
  ),
};

export const SmsConsentField = ({
  id,
  checked,
  disabled,
  onCheckedChange,
  label,
  disclosure,
}: {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: React.ReactNode;
  disclosure: React.ReactNode;
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex flex-row items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <label htmlFor={id} className="text-sm leading-snug cursor-pointer">
        {label}
      </label>
    </div>
    <p className="text-xs text-muted-foreground">{disclosure}</p>
  </div>
);
