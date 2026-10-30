"use client";

import {
  isRemoteSearchScope,
  parseCommandQuery,
  pathKeywords,
  scopesForHref,
  type CommandSearchScope,
} from "@/lib/command-search/scope";
import { adminApi } from "@hacado/api-sdk";
import { useI18n, type AllKeys } from "@hacado/i18n/client";
import { NavItem, NavItemGroup } from "@hacado/types/admin";
import { CommandSearchGroup, ConnectedApp } from "@hacado/types/apps";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@hacado/ui";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AddOrUpdateAppButton } from "../apps/add-or-update-app-dialog";
import type {
  CommandPaletteAction,
  CommandPaletteApp,
  CommandPaletteInstalledApp,
} from "./command-palette-data";

type CommandPaletteContextValue = {
  openPalette: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null,
);

export function CommandPaletteProvider({
  groups,
  actions,
  apps,
  installedApps,
  children,
}: {
  groups: NavItemGroup[];
  actions: CommandPaletteAction[];
  apps: CommandPaletteApp[];
  installedApps: CommandPaletteInstalledApp[];
  children: ReactNode;
}) {
  const t = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [remote, setRemote] = useState<CommandSearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [updateApp, setUpdateApp] = useState<ConnectedApp | null>(null);
  const [activeAction, setActiveAction] = useState<
    (CommandPaletteAction & { title: string }) | null
  >(null);

  const label = (key: string, args?: Record<string, string>) =>
    t(key as AllKeys, args);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) return;

    setQuery("");
    setRemote([]);
    setLoading(false);
  }, [open]);

  const parsed = parseCommandQuery(query);

  useEffect(() => {
    if (!open) return;

    if (parsed.text.length < 2 || !isRemoteSearchScope(parsed.scope)) {
      setRemote([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const data = await adminApi.search.searchCommands(
          { q: parsed.text, type: parsed.scope },
          { signal: controller.signal },
        );
        setRemote(data.groups ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setRemote([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, parsed.scope, parsed.text]);

  const go = (href: string, external?: boolean) => {
    setOpen(false);
    if (external) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }

    router.push(href);
  };

  const navigation = filterNavigation(groups, parsed, label);
  const quickActions = sortByQuery(
    actions
      .map((action) => ({
        ...action,
        title: label(action.labelKey),
      }))
      .filter(
        (action) =>
          actionVisible(action, parsed.scope) &&
          matches(
            parsed.text,
            action.title,
            action.keywords,
            action.href ? pathKeywords(action.href) : undefined,
          ),
      ),
    parsed.text,
  );
  const showApps =
    parsed.scope === "apps" || (!parsed.scope && parsed.text.length > 0);
  const appResults = showApps
    ? sortByQuery(
        apps
          .map((app) => ({
            ...app,
            title: label(app.displayNameKey),
            description: label(app.descriptionKey),
          }))
          .filter((app) =>
            matches(parsed.text, app.title, app.description, app.name),
          ),
        parsed.text,
      )
    : [];
  const navHrefs = new Set(
    navigation.flatMap((group) =>
      group.items.map((item) => item.href.split("?")[0]),
    ),
  );
  const visibleApps = appResults.filter(
    (app) => !navHrefs.has(app.href.split("?")[0]),
  );
  const installedResults =
    parsed.text.length > 0 || parsed.scope
      ? sortByQuery(
          installedApps
            .map((app) => ({
              ...app,
              title: label(app.displayNameKey),
              description: label(app.descriptionKey),
            }))
            .filter(
              (app) =>
                installedVisible(app.href, parsed.scope) &&
                matches(
                  parsed.text,
                  app.title,
                  app.description,
                  app.name,
                  app.account,
                ),
            ),
          parsed.text,
        )
      : [];

  const hasResults =
    quickActions.length > 0 ||
    navigation.length > 0 ||
    visibleApps.length > 0 ||
    installedResults.length > 0 ||
    remote.length > 0;

  return (
    <CommandPaletteContext.Provider
      value={{ openPalette: () => setOpen(true) }}
    >
      {children}
      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput
          placeholder={label("admin.commandPalette.placeholder")}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[min(60vh,28rem)]">
          {!query.trim() ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              {label("admin.commandPalette.typeHint")}
            </p>
          ) : null}
          {!hasResults && !loading ? (
            <CommandEmpty>{label("admin.commandPalette.empty")}</CommandEmpty>
          ) : null}
          {quickActions.length > 0 ? (
            <CommandGroup
              heading={label("admin.commandPalette.groups.actions")}
            >
              {quickActions.map((action) => (
                <CommandItem
                  key={action.id}
                  value={action.id}
                  onSelect={() => {
                    if (action.Action) {
                      setOpen(false);
                      setActiveAction(action);
                      return;
                    }

                    if (action.href) go(action.href, action.external);
                  }}
                >
                  <ItemIcon>{action.icon}</ItemIcon>
                  <span className="min-w-0 flex-1 truncate">
                    {action.title}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {navigation.map((group) => (
            <CommandGroup key={group.id} heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => go(item.href, item.external)}
                >
                  <ItemIcon>{item.icon}</ItemIcon>
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
          {visibleApps.length > 0 ? (
            <CommandGroup heading={label("admin.commandPalette.groups.apps")}>
              {visibleApps.map((app) => (
                <CommandItem
                  key={app.name}
                  value={`app:${app.name}`}
                  onSelect={() => go(app.href)}
                >
                  <ItemIcon>{app.logo}</ItemIcon>
                  <span className="min-w-0 flex-1 truncate">{app.title}</span>
                  <span className="max-w-[40%] truncate text-xs text-muted-foreground">
                    {app.description}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {installedResults.length > 0 ? (
            <CommandGroup
              heading={label("admin.commandPalette.groups.installedApps")}
            >
              {installedResults.map((app) => (
                <CommandItem
                  key={app.id}
                  value={`installed:${app.id}`}
                  onSelect={() => {
                    if (app.href) {
                      go(app.href);
                      return;
                    }

                    if (!app.connectedApp) return;

                    setOpen(false);
                    setUpdateApp(app.connectedApp);
                  }}
                >
                  <ItemIcon>{app.logo}</ItemIcon>
                  <span className="min-w-0 flex-1 truncate">{app.title}</span>
                  {app.account ? (
                    <span className="max-w-[40%] truncate text-xs text-muted-foreground">
                      {app.account}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {remote.map((group) => {
            const heading = label(group.labelKey);
            return (
              <CommandGroup key={group.id} heading={heading}>
                {group.items.map((item) => (
                  <CommandItem
                    key={`${group.id}:${item.id}`}
                    value={`${group.id}:${item.id}`}
                    onSelect={() => go(item.href)}
                  >
                    {item.image ? <ResultAvatar image={item.image} /> : null}
                    <span className="min-w-0 flex-1 truncate">
                      {item.title}
                    </span>
                    {item.subtitle ? (
                      <span className="max-w-[45%] truncate text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </CommandItem>
                ))}
                {group.listHref ? (
                  <CommandItem
                    value={`${group.id}:all`}
                    onSelect={() => go(group.listHref!)}
                  >
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {label("admin.commandPalette.viewAll", {
                        label: heading,
                      })}
                    </span>
                  </CommandItem>
                ) : null}
              </CommandGroup>
            );
          })}
          {loading ? (
            <CommandGroup>
              <CommandItem value="search-loading" disabled>
                {label("admin.commandPalette.loading")}
              </CommandItem>
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
      {updateApp ? (
        <AddOrUpdateAppButton
          app={updateApp}
          initialOpen
          onOpenChange={(next) => {
            if (!next) setUpdateApp(null);
          }}
        >
          <span className="hidden" />
        </AddOrUpdateAppButton>
      ) : null}
      {activeAction?.Action ? (
        <activeAction.Action
          appId={activeAction.appId}
          label={activeAction.title}
          icon={activeAction.icon}
          open
          onOpenChange={(next) => {
            if (!next) setActiveAction(null);
          }}
        />
      ) : null}
    </CommandPaletteContext.Provider>
  );
}

export function CommandPaletteTrigger() {
  const t = useI18n();
  const palette = useContext(CommandPaletteContext);
  const [shortcut, setShortcut] = useState("Ctrl+K");

  useEffect(() => {
    const platform = navigator.platform || "";
    setShortcut(/Mac|iPhone|iPad/.test(platform) ? "⌘K" : "Ctrl+K");
  }, []);

  if (!palette) return null;

  return (
    <button
      type="button"
      onClick={palette.openPalette}
      aria-label={t("admin.commandPalette.placeholder" as AllKeys)}
      className="inline-flex h-8 items-center gap-2 rounded-full border border-border/70 px-2.5 text-muted-foreground transition-colors hover:text-foreground"
    >
      <Search size={15} strokeWidth={1.5} />
      <span className="hidden text-sm md:inline">
        {t("admin.commandPalette.placeholder" as AllKeys)}
      </span>
      <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[10px] md:inline">
        {shortcut}
      </kbd>
    </button>
  );
}

function ResultAvatar({
  image,
}: {
  image: { src?: string; fallback: string };
}) {
  return (
    <Avatar className="mr-2 size-5 shrink-0">
      {image.src ? <AvatarImage src={image.src} alt="" /> : null}
      <AvatarFallback className="text-[10px]">{image.fallback}</AvatarFallback>
    </Avatar>
  );
}

function ItemIcon({ children }: { children: ReactNode }) {
  return (
    <span className="mr-2 flex size-4 shrink-0 items-center justify-center text-muted-foreground [&>svg]:size-4">
      {children}
    </span>
  );
}

function matches(query: string, ...parts: Array<string | undefined>) {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0);
  if (tokens.length === 0) return true;

  const haystack = parts
    .filter((part): part is string => Boolean(part))
    .join(" ")
    .toLowerCase();

  return tokens.every((token) => haystack.includes(token));
}

function rank(query: string, text: string) {
  const needle = query.trim().toLowerCase();
  if (!needle || text.toLowerCase().startsWith(needle)) return 0;

  return 1;
}

function actionVisible(
  action: { href?: string; scopes?: CommandSearchScope[] },
  scope?: CommandSearchScope,
) {
  if (!scope || scope === "actions") return true;
  if (scope === "apps" || scope === "navigation") return false;
  if (action.scopes?.includes(scope)) return true;
  if (!action.href) return false;

  return scopesForHref(action.href).includes(scope);
}

function visibleForScope(
  kind: "action" | "nav" | "app",
  href: string | undefined,
  scope?: CommandSearchScope,
) {
  if (!scope) return true;
  if (scope === "actions") return kind === "action";
  if (scope === "apps") return kind === "app";
  if (scope === "navigation") return kind === "nav";
  if (!href) return false;

  return scopesForHref(href).includes(scope);
}

function installedVisible(
  href: string | undefined,
  scope?: CommandSearchScope,
) {
  if (!scope || scope === "apps") return true;
  if (scope === "actions" || scope === "navigation") return false;
  if (!href) return false;

  return scopesForHref(href).includes(scope);
}

function sortByQuery<T extends { title: string }>(items: T[], query: string) {
  return [...items].sort(
    (left, right) => rank(query, left.title) - rank(query, right.title),
  );
}

function filterNavigation(
  groups: NavItemGroup[],
  parsed: { scope?: CommandSearchScope; text: string },
  label: (key: string) => string,
) {
  if (parsed.scope === "actions" || parsed.scope === "apps") return [];

  return groups.flatMap((group) => {
    const heading = label(group.title);
    const items = sortByQuery(
      collectNavItems(group, heading, parsed, label),
      parsed.text,
    );

    if (items.length === 0) return [];

    return [{ id: group.id, heading, items }];
  });
}

function collectNavItems(
  group: NavItemGroup,
  heading: string,
  parsed: { scope?: CommandSearchScope; text: string },
  label: (key: string) => string,
) {
  const items: Array<{
    id: string;
    href: string;
    title: string;
    external?: boolean;
    icon?: ReactNode;
  }> = [];
  const seenHrefs = new Set<string>();

  const push = (item: NavItem, parentTitle?: string) => {
    if (!item.href || item.disabled) return;
    if (!visibleForScope("nav", item.href, parsed.scope)) return;

    const href = item.href.split("?")[0] ?? item.href;
    if (seenHrefs.has(href)) return;

    const title = label(item.title);
    if (
      !matches(
        parsed.text,
        title,
        heading,
        parentTitle,
        pathKeywords(item.href),
      )
    ) {
      return;
    }

    seenHrefs.add(href);
    items.push({
      id: `${group.id}:${item.id}:${item.href}`,
      href: item.href,
      title,
      external: item.external,
      icon: item.icon,
    });
  };

  for (const child of group.children) {
    if (child.items?.length) {
      const parentTitle = label(child.title);
      push(child);
      for (const nested of child.items) push(nested, parentTitle);
      continue;
    }

    push(child);
  }

  return items;
}
