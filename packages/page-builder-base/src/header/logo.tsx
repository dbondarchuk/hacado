import { StaticText } from "@hacado/rte-inline/reader";
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
export const Logo: React.FC<{
  customLogoText?: string | any[];
  showLogo?: boolean;
  logo?: string;
  name: string;
  className?: string;
  imageClassName?: string;
  logoSize?: PageHeaderLogoSize;
  logoNameFontSize?: PageHeaderLogoNameFontSize;
  logoNameFontWeight?: PageHeaderLogoNameFontWeight;
  headerId?: string;
}> = ({
  logo,
  showLogo,
  name,
  className,
  imageClassName,
  logoSize,
  logoNameFontSize,
  logoNameFontWeight,
  headerId,
  customLogoText,
}) => {
  return (
    <Link
      href="/"
      className={cn(
        "flex title-font font-medium items-center gap-2 header-logo-container",
        headerId && `header-${headerId}-logo-container`,
        className,
      )}
      data-testid="logo"
      data-header-id={headerId}
    >
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
        {customLogoText ? <StaticText value={customLogoText} inline /> : name}
      </span>
    </Link>
  );
};
