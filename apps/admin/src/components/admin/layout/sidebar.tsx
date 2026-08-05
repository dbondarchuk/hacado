"use client";
import { useI18n } from "@hacado/i18n/client";
import { NavItemGroup } from "@hacado/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Link,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@hacado/ui";
import { ChevronRight, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";
import { SidebarNavIcon } from "./sidebar-nav-icon";
import { SidebarNavLabel } from "./sidebar-nav-label";
import { UserNav } from "./user-nav";

const getItemNotificationKeys = (
  item: NavItemGroup["children"][number],
): Array<string | undefined> => {
  const keys = [
    item.notificationsCountKey,
    ...(item.items?.map((subItem) => subItem.notificationsCountKey) ?? []),
  ].filter((key): key is string => Boolean(key));

  return [...new Set(keys)];
};

const collectHrefs = (menuItems: NavItemGroup[]): string[] => {
  const hrefs: string[] = [];
  for (const group of menuItems) {
    for (const item of group.children) {
      if (item.href) hrefs.push(item.href);
      for (const subItem of item.items ?? []) {
        if (subItem.href) hrefs.push(subItem.href);
      }
    }
  }
  return hrefs;
};

/** Prefer the longest matching href so /apps does not steal /apps/store. */
const getBestMatchingHref = (
  path: string,
  hrefs: string[],
): string | undefined => {
  let best: string | undefined;
  for (const href of hrefs) {
    const matches =
      path === href || (href !== "/" && path.startsWith(`${href}/`));
    if (!matches) continue;
    if (!best || href.length > best.length) {
      best = href;
    }
  }
  return best;
};

type SidebarProps = {
  className?: string;
  menuItems: NavItemGroup[];
  name: string;
  domain: string;
  logo?: string;
};

export const AppSidebar: React.FC<SidebarProps> = ({
  className,
  menuItems,
  name,
  domain,
  logo,
}) => {
  const path = usePathname();
  const { open, isMobile, setOpenMobile } = useSidebar();
  const t = useI18n();
  React.useEffect(() => {
    setOpenMobile(false);
  }, [path, setOpenMobile]);

  const allHrefs = React.useMemo(() => collectHrefs(menuItems), [menuItems]);
  const bestHref = React.useMemo(
    () => getBestMatchingHref(path, allHrefs),
    [path, allHrefs],
  );

  const isHrefActive = (href?: string) => !!href && href === bestHref;

  return (
    <Sidebar collapsible="icon" className={cn("border-r-0", className)}>
      <SidebarHeader className="px-3 py-4">
        <SidebarMenuButton
          size="lg"
          className="pointer-events-none hover:bg-transparent active:bg-transparent data-[active=true]:bg-transparent"
        >
          <div className="flex aspect-square size-9 items-center justify-center">
            <Avatar className="h-9 w-9 rounded-full ring-1 ring-primary/20">
              <AvatarImage src={logo} alt={name} />
              <AvatarFallback className="rounded-full bg-primary/10 text-primary font-display text-base">
                {name[0]}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate font-display text-base font-normal tracking-tight text-sidebar-accent-foreground">
              {name}
            </span>
            <span className="truncate font-display text-xs tracking-tight text-muted-foreground">
              {domain}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent className="gap-1 px-2">
        {menuItems.map((group, index) => (
          <SidebarGroup key={index} className="py-1">
            <SidebarGroupLabel className="px-2 text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70">
              {t(group.title)}
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1">
              {group.children.map((item) => {
                const childActive = !!item.items?.some((sub) =>
                  isHrefActive(sub.href),
                );
                const itemActive = isHrefActive(item.href) || childActive;

                return (
                  <React.Fragment key={item.title}>
                    {item.items?.length ? (
                      isMobile || open ? (
                        <Collapsible
                          asChild
                          defaultOpen={itemActive}
                          className="group/collapsible"
                        >
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton
                                size="default"
                                tooltip={t(item.title)}
                                isActive={itemActive}
                                className="rounded-lg text-[17px] text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                              >
                                {item.icon && (
                                  <SidebarNavIcon
                                    icon={item.icon}
                                    notificationKeys={getItemNotificationKeys(
                                      item,
                                    )}
                                  />
                                )}
                                <SidebarNavLabel
                                  title={item.title}
                                  notificationKeys={getItemNotificationKeys(
                                    item,
                                  )}
                                />
                                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 size-4 opacity-50" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="border-sidebar-border/60 ml-3.5">
                                {item.items?.map((subItem) => (
                                  <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isHrefActive(subItem.href)}
                                      className="rounded-md text-base data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                                    >
                                      <Link href={subItem.href || "/"}>
                                        {subItem.icon && (
                                          <SidebarNavIcon
                                            icon={subItem.icon}
                                            notificationsCountKey={
                                              subItem.notificationsCountKey
                                            }
                                          />
                                        )}
                                        <SidebarNavLabel
                                          title={subItem.title}
                                          notificationsCountKey={
                                            subItem.notificationsCountKey
                                          }
                                        />
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      ) : (
                        <SidebarMenuItem>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <SidebarMenuButton
                                size="default"
                                tooltip={t(item.title)}
                                isActive={itemActive}
                                className="rounded-lg text-[17px] text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                              >
                                {item.icon && (
                                  <SidebarNavIcon
                                    icon={item.icon}
                                    notificationKeys={getItemNotificationKeys(
                                      item,
                                    )}
                                  />
                                )}
                                <SidebarNavLabel
                                  title={item.title}
                                  notificationKeys={getItemNotificationKeys(
                                    item,
                                  )}
                                />
                              </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              className="w-fit rounded-lg px-2 py-2 flex flex-col gap-2"
                              side={isMobile ? "bottom" : "right"}
                              align={isMobile ? "end" : "start"}
                            >
                              <DropdownMenuLabel>
                                {t(item.title)}
                              </DropdownMenuLabel>
                              {item.items?.map((subItem) => (
                                <DropdownMenuItem asChild key={subItem.title}>
                                  <Link
                                    href={subItem.href || "/"}
                                    className="inline-flex items-center gap-2 cursor-pointer text-sidebar-foreground hover:text-sidebar-accent-foreground text-base"
                                  >
                                    {subItem.icon && (
                                      <SidebarNavIcon
                                        icon={subItem.icon}
                                        notificationsCountKey={
                                          subItem.notificationsCountKey
                                        }
                                      />
                                    )}
                                    <SidebarNavLabel
                                      title={subItem.title}
                                      notificationsCountKey={
                                        subItem.notificationsCountKey
                                      }
                                    />
                                  </Link>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </SidebarMenuItem>
                      )
                    ) : (
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          size="default"
                          className="rounded-lg text-[17px] text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                          asChild
                          isActive={isHrefActive(item.href)}
                          tooltip={t(item.title)}
                        >
                          <Link href={item.href || "/"}>
                            {item.icon && (
                              <SidebarNavIcon
                                icon={item.icon}
                                notificationsCountKey={
                                  item.notificationsCountKey
                                }
                              />
                            )}
                            <SidebarNavLabel
                              title={item.title}
                              notificationsCountKey={item.notificationsCountKey}
                            />
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </React.Fragment>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="px-2 pb-3">
        <UserNav />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

export const AppSidebarTrigger: React.FC<{ className?: string }> = ({
  className,
}) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      variant="ghost"
      aria-label="Toggle Sidebar"
      className={cn(className)}
      onClick={toggleSidebar}
    >
      <Menu />
    </Button>
  );
};
