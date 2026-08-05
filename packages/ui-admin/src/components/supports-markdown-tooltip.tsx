import { useI18n } from "@hacado/i18n/client";
import {
  Link,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
} from "@hacado/ui";
import { CodeSquare } from "lucide-react";
import React from "react";

export type SupportsMarkdownTooltipProps = {
  supportsMdx?: boolean;
};

export const SupportsMarkdownTooltip: React.FC<
  SupportsMarkdownTooltipProps
> = ({ supportsMdx }) => {
  const t = useI18n("ui");

  return (
    <TooltipResponsive>
      <TooltipResponsiveTrigger>
        <CodeSquare className="align-top ml-1 size-3 inline-block cursor-help" />
      </TooltipResponsiveTrigger>
      <TooltipResponsiveContent className="pt-2">
        <p>
          {t("markdownTooltip.supports", {
            type: supportsMdx ? "MDX" : "Markdown",
          })}
        </p>
        <p>
          <Link
            variant="dashed"
            target="_blank"
            href={
              supportsMdx
                ? "https://mdxjs.com/docs/what-is-mdx/"
                : "https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax"
            }
          >
            {t("markdownTooltip.learnMore")}
          </Link>
        </p>
      </TooltipResponsiveContent>
    </TooltipResponsive>
  );
};
