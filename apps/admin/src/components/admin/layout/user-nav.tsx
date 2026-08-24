"use client";
import { authClient } from "@/app/auth-client";
import type { AdminKeys } from "@hacado/i18n";
import { useI18n } from "@hacado/i18n/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@hacado/ui";
import { ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const roleLabelKey: Record<string, AdminKeys> = {
  owner: "roles.owner",
  admin: "roles.admin",
  coordinator: "roles.coordinator",
  staff: "roles.staff",
};

export function UserNav() {
  const { data: session } = authClient.useSession();

  const { isMobile } = useSidebar();
  const router = useRouter();
  const logout = async () => {
    await authClient.signOut();
    router.push("/");
  };

  const t = useI18n("admin");
  if (!session) {
    return null;
  }

  const role = (session.user as { role?: string })?.role ?? "staff";
  const roleKey: AdminKeys = roleLabelKey[role] ?? "roles.staff";

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="rounded-xl data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-9 w-9 rounded-full">
                <AvatarImage
                  src={session.user?.image ?? ""}
                  alt={session.user?.name ?? ""}
                />
                <AvatarFallback className="rounded-full bg-primary/15 text-primary">
                  {session.user?.name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-base leading-tight">
                <span className="truncate font-medium">
                  {session.user?.name}
                </span>
                <span className="truncate text-sm text-muted-foreground">
                  {t(roleKey)}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-base font-medium leading-none truncate">
                  {session.user?.name}
                </p>
                <p className="text-sm leading-none text-muted-foreground truncate">
                  {session.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/users/me/profile">
                  {t("navigation.profile")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              {t("navigation.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
