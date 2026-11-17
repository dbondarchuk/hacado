import { cn } from "@hacado/ui/cn";
import { ScrollArea } from "@hacado/ui/scroll-area";
import React from "react";

const viewportHeightClassName =
  "h-[calc(100dvh-56px)] group-[.has-banner]/main:h-[calc(100dvh-129px)]";

export default function PageContainer({
  children,
  scrollable = false,
  fill = false,
}: {
  children: React.ReactNode;
  scrollable?: boolean;
  /** Lock to the viewport height with no page scroll (builder hosts). */
  fill?: boolean;
}) {
  if (fill) {
    return (
      <div
        data-page-shell
        className={cn(
          viewportHeightClassName,
          "flex min-h-0 w-full min-w-0 flex-col overflow-hidden pt-2 pb-4 px-4 md:px-6 md:pb-6",
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <>
      {scrollable ? (
        <ScrollArea
          className={cn(
            viewportHeightClassName,
            "w-full [&>div>div[style]]:!block [&>div>div[style]]:h-full pb-3",
          )}
        >
          <div
            data-page-shell
            className="flex min-w-0 w-full flex-1 pt-2 pb-4 px-4 md:px-6 md:pb-6 h-full"
          >
            {children}
          </div>
          {/* <ScrollBar orientation="horizontal" /> */}
        </ScrollArea>
      ) : (
        <div
          data-page-shell
          className="flex min-w-0 w-full flex-1 py-2 px-4 md:px-6 md:pb-6"
        >
          {children}
        </div>
      )}
    </>
  );
}
