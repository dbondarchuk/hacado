import { richTextToString, StaticText } from "@hacado/rte-inline/reader";
import {
  PageHeaderLogoNameFontSize,
  PageHeaderLogoNameFontWeight,
  PageHeaderLogoSize,
} from "@hacado/types";
import { cn } from "@hacado/ui/src/utils";
import Link from "next/link";
import React from "react";

const logoSizeClassNames: Record<PageHeaderLogoSize, string> = {
  small: "max-h-7",
  medium: "max-h-8",
  large: "max-h-9",
  "x-large": "max-h-10",
};

const logoNameFontSizeClassNames: Record<PageHeaderLogoNameFontSize, string> = {
  small: "text-lg",
  medium: "text-xl",
  large: "text-2xl",
  "x-large": "text-3xl",
};

const logoNameFontWeightClassNames: Record<
  PageHeaderLogoNameFontWeight,
  string
> = {
  light: "font-light",
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

type LogoFields = {
  customLogoText?: string | any[];
  showLogo?: boolean;
  hideName?: boolean;
  logo?: string;
  logoSize?: PageHeaderLogoSize | null;
  logoNameFontSize?: PageHeaderLogoNameFontSize | null;
  logoNameFontWeight?: PageHeaderLogoNameFontWeight | null;
};

function logoFieldsKey(fields: LogoFields) {
  return JSON.stringify({
    logo: fields.logo ?? null,
    showLogo: fields.showLogo ?? null,
    hideName: fields.hideName ?? null,
    logoSize: fields.logoSize ?? null,
    logoNameFontSize: fields.logoNameFontSize ?? null,
    logoNameFontWeight: fields.logoNameFontWeight ?? null,
    customLogoText: fields.customLogoText ?? null,
  });
}

function LogoMark({
  name,
  headerId,
  imageClassName,
  className,
  logo,
  showLogo,
  hideName,
  logoSize,
  logoNameFontSize,
  logoNameFontWeight,
  customLogoText,
}: LogoFields & {
  name: string;
  headerId?: string;
  imageClassName?: string;
  className?: string;
}) {
  return (
    <span className={cn("contents", className)}>
      {logo && showLogo && (
        <img
          className={cn(
            "relative object-contain header-logo-image",
            logoSize ? logoSizeClassNames[logoSize] : "max-h-9",
            headerId && `header-${headerId}-logo-image`,
            imageClassName,
          )}
          src={logo}
          alt={name}
        />
      )}
      {!hideName && (
        <span
          className={cn(
            "font-primary header-logo-text",
            logoNameFontSize
              ? logoNameFontSizeClassNames[logoNameFontSize]
              : "text-xl",
            logoNameFontWeight
              ? logoNameFontWeightClassNames[logoNameFontWeight]
              : "font-medium",
            headerId && `header-${headerId}-logo-text`,
          )}
        >
          {customLogoText && richTextToString(customLogoText).trim() ? (
            <StaticText value={customLogoText} inline />
          ) : (
            name
          )}
        </span>
      )}
    </span>
  );
}

export const Logo: React.FC<
  LogoFields & {
    name: string;
    className?: string;
    imageClassName?: string;
    headerId?: string;
    /**
     * Desktop and mobile marks, switched with CSS at `lg` so the first paint
     * matches the viewport instead of swapping after hydration.
     */
    breakpointVariants?: {
      mobile: LogoFields;
      desktop: LogoFields;
    };
  }
> = ({
  name,
  className,
  imageClassName,
  headerId,
  breakpointVariants,
  ...fields
}) => {
  const marks =
    breakpointVariants &&
    logoFieldsKey(breakpointVariants.mobile) !==
      logoFieldsKey(breakpointVariants.desktop)
      ? [
          { fields: breakpointVariants.mobile, className: "lg:hidden" },
          {
            fields: breakpointVariants.desktop,
            className: "hidden lg:contents",
          },
        ]
      : [{ fields, className: undefined }];

  return (
    <Link
      href="/"
      className={cn(
        "flex title-font font-medium items-center shrink-0 gap-2 header-logo-container",
        headerId && `header-${headerId}-logo-container`,
        className,
      )}
      data-testid="logo"
      data-header-id={headerId}
    >
      {marks.map((mark) => (
        <LogoMark
          key={mark.className ?? "logo"}
          name={name}
          headerId={headerId}
          imageClassName={imageClassName}
          className={mark.className}
          {...mark.fields}
        />
      ))}
    </Link>
  );
};
