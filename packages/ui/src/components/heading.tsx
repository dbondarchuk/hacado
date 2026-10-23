import React from "react";
import { cn } from "../utils/cn";
import { Link } from "./link";

type HeadingProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  href?: string;
  className?: string;
};

export const Heading: React.FC<HeadingProps> = ({
  title,
  description,
  href,
  className,
}) => {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <h2 className="text-2xl font-bold tracking-tight">
        {href ? (
          <Link href={href} variant="underline">
            {title}
          </Link>
        ) : (
          title
        )}
      </h2>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
};
