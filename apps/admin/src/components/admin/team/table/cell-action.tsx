"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import type { UserRole } from "@hacado/types";
import {
  AlertModal,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toastPromise,
} from "@hacado/ui";
import { useAuth } from "@hacado/ui-admin";
import { canUpdateTeamMemberProfile } from "@hacado/utils";
import { MoreHorizontal, Pencil, UserCog, UserMinus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TeamMemberListModel } from "./types";

interface CellActionProps {
  member: TeamMemberListModel;
}

const ASSIGNABLE_ROLES: Exclude<UserRole, "owner">[] = [
  "admin",
  "coordinator",
  "staff",
];

export const CellAction: React.FC<CellActionProps> = ({ member }) => {
  const t = useI18n("admin");
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [forceOpen, setForceOpen] = useState(false);

  const canEditProfile = canUpdateTeamMemberProfile(user, {
    memberId: member._id,
    role: member.role,
  });

  if (member.role === "owner" && !canEditProfile) {
    return null;
  }

  const onChangeRole = async (role: Exclude<UserRole, "owner">) => {
    if (role === member.role) return;
    try {
      setLoading(true);
      await toastPromise(
        (async () => {
          const result = await adminApi.teams.updateMemberRole({
            memberId: member._id,
            role,
          });
          if (!result.ok) throw new Error(result.code);
          return result;
        })(),
        {
          success: t("team.roleUpdated"),
          error: t("common.toasts.error"),
        },
      );
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onRequestDeactivate = async () => {
    try {
      setLoading(true);
      const check = await adminApi.teams.getMemberUpcomingAppointments(
        member._id,
      );
      if (check.ok && check.upcoming.length) {
        setUpcomingCount(check.upcoming.length);
        setForceOpen(true);
        return;
      }
      await toastPromise(
        (async () => {
          const result = await adminApi.teams.deactivateMember({
            memberId: member._id,
          });
          if (!result.ok) throw new Error(result.code);
          return result;
        })(),
        {
          success: t("team.deactivate"),
          error: t("common.toasts.error"),
        },
      );
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onForceDeactivate = async () => {
    try {
      setLoading(true);
      await toastPromise(
        (async () => {
          const result = await adminApi.teams.deactivateMember({
            memberId: member._id,
            force: true,
          });
          if (!result.ok) throw new Error(result.code);
          return result;
        })(),
        {
          success: t("team.deactivate"),
          error: t("common.toasts.error"),
        },
      );
      setForceOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showRoleActions = member.role !== "owner" && member.status === "active";
  const showDeactivate = member.role !== "owner" && member.status === "active";

  if (!canEditProfile && !showRoleActions && !showDeactivate) {
    return null;
  }

  return (
    <>
      <AlertModal
        isOpen={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        onConfirm={onRequestDeactivate}
        loading={loading}
      />
      <Dialog open={forceOpen} onOpenChange={setForceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("team.deactivateTitle")}</DialogTitle>
            <DialogDescription>{t("team.deactivateBody")}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{upcomingCount}</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/appointments?member=${member._id}`}>
                {t("team.reassignAppointments")}
              </Link>
            </Button>
            <Button
              variant="destructive"
              disabled={loading}
              onClick={onForceDeactivate}
            >
              {t("team.deactivateAnyway")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
            <span className="sr-only">{t("common.openMenu")}</span>
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {t("team.table.columns.cellAction.actions")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {canEditProfile ? (
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/settings/team/${member._id}/profile`}>
                <Pencil className="size-3.5" />
                {t("team.table.columns.cellAction.editProfile")}
              </Link>
            </DropdownMenuItem>
          ) : null}
          {showRoleActions
            ? ASSIGNABLE_ROLES.filter((role) => role !== member.role).map(
                (role) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => onChangeRole(role)}
                  >
                    <UserCog className="size-3.5" />
                    {t("team.table.columns.cellAction.setRole", {
                      role: t(
                        role === "admin"
                          ? "roles.admin"
                          : role === "coordinator"
                            ? "roles.coordinator"
                            : "roles.staff",
                      ),
                    })}
                  </DropdownMenuItem>
                ),
              )
            : null}
          {showDeactivate ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDeactivateOpen(true)}>
                <UserMinus className="size-3.5" />
                {t("team.deactivate")}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
