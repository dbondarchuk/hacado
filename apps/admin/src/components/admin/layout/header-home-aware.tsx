"use client";

import { Separator, useConfig } from "@hacado/ui";
import { usePathname } from "next/navigation";

/** On dashboard home, show the business name; elsewhere render breadcrumbs. */
export function HeaderHomeAware({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { name } = useConfig();

  if (pathname === "/dashboard") {
    return (
      <div className="flex items-center gap-2">
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="grid w-full">
          <span className="truncate text-base font-medium tracking-tight text-foreground">
            {name}
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
