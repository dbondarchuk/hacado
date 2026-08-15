"use client";

import { cn } from "@hacado/ui";
import React from "react";

export const HeaderWithScrollShadow: React.FC<{
  children: React.ReactElement;
}> = ({ children }) => {
  const [top, setTop] = React.useState(true);

  React.useEffect(() => {
    const scrollHandler = () => {
      window.scrollY > 10 ? setTop(false) : setTop(true);
    };
    window.addEventListener("scroll", scrollHandler);
    return () => window.removeEventListener("scroll", scrollHandler);
  }, [top]);

  const clone = React.cloneElement(children, {
    ...(children.props as {}),
    className: cn(
      (children.props as { className: string })?.className,
      !top ? "drop-shadow-md" : "",
    ),
  } as {});

  return clone;
};
