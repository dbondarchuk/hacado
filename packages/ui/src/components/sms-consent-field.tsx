"use client";

import React from "react";
import { Checkbox } from "./checkbox";

const linkClassName = "underline underline-offset-2";

const policyLink = (href?: string) => (chunks: React.ReactNode) =>
  href ? (
    <a className={linkClassName} href={href} target="_blank" rel="noreferrer">
      {chunks}
    </a>
  ) : (
    <span className={linkClassName}>{chunks}</span>
  );

export const smsPolicyRichTags = (pages: {
  privacyUrl?: string;
  termsUrl?: string;
}) => ({
  terms: policyLink(pages.termsUrl),
  privacy: policyLink(pages.privacyUrl),
});

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
