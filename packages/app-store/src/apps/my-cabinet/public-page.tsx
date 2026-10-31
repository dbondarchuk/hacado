import type { PublicPageRendererProps } from "@hacado/types/apps";
import { Skeleton } from "@hacado/ui/skeleton";
import { Suspense } from "react";
import { MyCabinetBlockComponent } from "./blocks/my-cabinet/component";
import type { MyCabinetConnectedApp } from "./service";

function MyCabinetPublicPageSkeleton() {
  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4 items-center justify-center py-12">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

async function MyCabinetPublicPageContent({
  appId,
  appService,
}: PublicPageRendererProps) {
  const waitlistAppId = await (
    appService as MyCabinetConnectedApp
  ).resolveWaitlistAppId();

  return (
    <div className="px-4 py-4 md:py-8">
      <MyCabinetBlockComponent
        appId={appId}
        waitlistAppId={waitlistAppId}
        style={{}}
        showTitle
        scrollToTop
      />
    </div>
  );
}

export function MyCabinetPublicPage(props: PublicPageRendererProps) {
  return (
    <Suspense fallback={<MyCabinetPublicPageSkeleton />}>
      <MyCabinetPublicPageContent {...props} />
    </Suspense>
  );
}
