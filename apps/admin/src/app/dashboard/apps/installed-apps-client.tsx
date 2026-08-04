"use client";

import { ConnectedAppRow } from "@/components/admin/apps/connected-app";
import { AvailableApps } from "@timelish/app-store";
import { withCatalogTarget } from "@timelish/app-store/utils";
import { useI18n } from "@timelish/i18n/client";
import { ConnectedApp } from "@timelish/types";
import {
  Button,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupAddonClasses,
  InputGroupInput,
  InputGroupInputClasses,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@timelish/ui";
import { MemberSelector } from "@timelish/ui-admin";
import { Search, X } from "lucide-react";
import React from "react";

type InstalledAppsClientProps = {
  apps: ConnectedApp[];
  currentMemberId: string;
  showCompanyScope: boolean;
  showMemberPicker: boolean;
  /** Member IDs omitted from the picker (e.g. owners when viewer is not owner). */
  excludeMemberIds?: string[];
};

type AppsScope = "company" | "member";

export const InstalledAppsClient: React.FC<InstalledAppsClientProps> = ({
  apps,
  currentMemberId,
  showCompanyScope,
  showMemberPicker,
  excludeMemberIds,
}) => {
  const tApps = useI18n("apps");
  const [search, setSearch] = React.useState("");
  const [scope, setScope] = React.useState<AppsScope>(
    showCompanyScope ? "company" : "member",
  );
  const [memberId, setMemberId] = React.useState(currentMemberId);

  const normalizedSearch = search.trim().toLowerCase();

  const scopedApps = React.useMemo(() => {
    return apps.filter((app) => {
      const { target } = withCatalogTarget(app);
      if (scope === "company") return target === "company";
      return target === "member" && app.memberId === memberId;
    });
  }, [apps, scope, memberId]);

  const filteredApps = React.useMemo(() => {
    if (!normalizedSearch) return scopedApps;

    return scopedApps.filter((app) => {
      const descriptor = AvailableApps[app.name];
      const translatedName = descriptor
        ? tApps(descriptor.displayName as any).toLowerCase()
        : "";
      const internalName = app.name.toLowerCase();

      return (
        internalName.includes(normalizedSearch) ||
        translatedName.includes(normalizedSearch)
      );
    });
  }, [scopedApps, normalizedSearch, tApps]);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {showCompanyScope && (
            <Tabs
              value={scope}
              onValueChange={(value) => setScope(value as AppsScope)}
            >
              <TabsList>
                <TabsTrigger value="company">
                  {tApps("target.company")}
                </TabsTrigger>
                <TabsTrigger value="member">
                  {tApps("target.member")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          {scope === "member" && showMemberPicker && (
            <MemberSelector
              className="w-full sm:w-56"
              value={memberId}
              excludeIds={excludeMemberIds}
              onItemSelect={setMemberId}
            />
          )}
        </div>
        <InputGroup className="w-full md:max-w-sm">
          <InputGroupAddon
            className={InputGroupAddonClasses({ variant: "prefix", h: "sm" })}
          >
            <Search className="size-3.5" />
          </InputGroupAddon>
          <InputGroupInput>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setSearch("");
                }
              }}
              h="sm"
              placeholder={tApps("installedApps.searchPlaceholder")}
              className={InputGroupInputClasses({ variant: "both" })}
            />
          </InputGroupInput>
          <InputGroupAddon
            className={InputGroupAddonClasses({ variant: "suffix", h: "sm" })}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSearch("")}
              disabled={!search}
              aria-label="Clear search"
              className="size-7"
            >
              <X className="size-3.5" />
            </Button>
          </InputGroupAddon>
        </InputGroup>
      </div>
      {filteredApps.map((app) => (
        <ConnectedAppRow app={app} key={app._id} />
      ))}
      {scopedApps.length === 0 && (
        <div className="rounded-lg border bg-muted/20 p-8 text-center text-base text-muted-foreground">
          {tApps("installedApps.noInstalledApps")}
        </div>
      )}
      {scopedApps.length > 0 && filteredApps.length === 0 && (
        <div className="rounded-lg border bg-muted/20 p-8 text-center text-base text-muted-foreground">
          {tApps("installedApps.noResults")}
        </div>
      )}
    </div>
  );
};
