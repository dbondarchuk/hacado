import { cva, VariantProps } from "class-variance-authority";
import NextLink from "next/link";
import React from "react";
import { cn } from "../utils";
import { ButtonSize, ButtonVariant, buttonVariants } from "./button";
import { textVariants, TextVariants } from "./text";

const linkVariants = {
  none: "",
  default: "underline",
  underline: "underline",
  standalone: "no-underline",
  dashed: "underline decoration-dashed",
};

const linkSizes = {
  none: "",
  xs: "text-sm",
  sm: "text-base",
  md: "text-md",
  lg: "text-xl",
  xl: "text-2xl",
};

export const linkClasses = cva(
  [
    "text-primary hover:text-primary/80 active:text-primary/80 focus:text-primary/80  transition-all",
  ],
  {
    variants: {
      variant: linkVariants,
      size: linkSizes,
    },
    defaultVariants: {
      variant: "none",
      size: "none",
    },
  },
);

export type LinkVariant = VariantProps<typeof linkClasses>["variant"];
export const LinkVariants = Object.keys(
  linkVariants,
) as (keyof typeof linkVariants)[];

export type LinkSize = VariantProps<typeof linkClasses>["size"];
export const LinkSizes = Object.keys(linkSizes) as (keyof typeof linkSizes)[];

type BaseProps = Omit<React.ComponentProps<"a">, "as" | "href"> &
  TextVariants & {
    target?: "_blank" | "_parent" | "_self" | "_top";
    hardNavigate?: boolean;
    href: string;
  };

type BaseLinkProps = BaseProps & {
  variant?: LinkVariant;
  size?: LinkSize;
};

type ButtonLinkProps = BaseProps & {
  button?: true;
  as?: "link" | "externalLink";
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export type LinkProps = BaseLinkProps | ButtonLinkProps;

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  (props, ref) => {
    let passProps = props;
    let classes: string = "";
    const textClasses = textVariants({
      fontSize: props.fontSize,
      fontWeight: props.fontWeight,
      font: props.font,
    });

    if ("button" in props) {
      const { button, ...rest } = props;
      passProps = rest;

      classes = buttonVariants({
        variant: props.variant,
        size: props.size,
      });
    } else {
      const linkProps = props as BaseLinkProps;
      classes = linkClasses({
        variant: linkProps.variant,
        size: linkProps.size,
      });
    }

    const Component = props.hardNavigate ? "a" : NextLink;
    return (
      <Component
        ref={ref}
        {...passProps}
        className={cn(classes, textClasses, props.className)}
      />
    );
  },
);

Link.displayName = "Link";
