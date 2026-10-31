import { ScrollArea } from "@hacado/ui/scroll-area";
import React from "react";

export default function PageContainer({
  children,
  scrollable = false,
}: {
  children: React.ReactNode;
  scrollable?: boolean;
}) {
  return (
    <>
      {scrollable ? (
        <ScrollArea className="h-[calc(100dvh-56px)] group-[.has-banner]/main:h-[calc(100dvh-129px)] w-full [&>div>div[style]]:!block [&>div>div[style]]:h-full pb-3">
          <div className="flex min-w-0 w-full flex-1 pt-2 pb-4 px-4 md:px-6 md:pb-6 h-full">
            {children}
          </div>
          {/* <ScrollBar orientation="horizontal" /> */}
        </ScrollArea>
      ) : (
        <div className="flex min-w-0 w-full flex-1 pt-2 pb-4 px-4 md:px-6 md:pb-6">
          {children}
        </div>
      )}
    </>
  );
}
