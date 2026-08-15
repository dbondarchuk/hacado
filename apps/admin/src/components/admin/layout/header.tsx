import { getSession, getWebsiteUrl } from "@/app/utils";
import { getI18nAsync } from "@hacado/i18n/server";
import { Link, Separator, SidebarTrigger } from "@hacado/ui";
import { canReadActivity } from "@hacado/utils";
import { Globe2 } from "lucide-react";
import { ActivityFeedHeaderButton } from "./activity-feed-header-button";
import { BreadcrumbsRender } from "./breadcrumbs";
import { HeaderHomeAware } from "./header-home-aware";
import ThemeToggle from "./theme-toggle/theme-toggle";

export default async function Header({}: {}) {
  const t = await getI18nAsync("admin");
  const websiteUrl = await getWebsiteUrl();
  const session = await getSession();
  const showActivity = canReadActivity(session?.user);

  return (
    <header className="sticky inset-x-0 top-0 z-10 w-full bg-background/80 backdrop-blur-sm">
      <nav className="flex items-center justify-between px-4 lg:px-8 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <SidebarTrigger
            className="-ml-2 h-8 w-8 rounded-full border border-border/60 bg-background flex-shrink-0"
            iconSize={16}
          />
          <HeaderHomeAware>
            <Separator orientation="vertical" className="mr-2 h-4" />
            <BreadcrumbsRender />
          </HeaderHomeAware>
        </div>

        <div className="flex items-center gap-1.5">
          {showActivity ? <ActivityFeedHeaderButton /> : null}
          <ThemeToggle />
          <Link
            href={websiteUrl}
            target="_blank"
            button
            variant="outline"
            className="inline-flex items-center gap-1.5 rounded-full border-border/70 text-muted-foreground hover:text-foreground"
          >
            <Globe2 size={15} strokeWidth={1.5} />{" "}
            <span className="hidden md:inline text-base">
              {t("navigation.viewWebsite")}
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
