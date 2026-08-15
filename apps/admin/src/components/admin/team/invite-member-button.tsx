"use client";

import { TeamSeatsCapacityHint } from "@/components/admin/team/team-seats-capacity-hint";
import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toastPromise,
} from "@hacado/ui";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  atCapacity: boolean;
  allowAdditionalUsers: boolean;
};

export function InviteMemberButton({
  atCapacity,
  allowAdditionalUsers,
}: Props) {
  const t = useI18n("admin");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "coordinator" | "staff">("staff");

  const noSlotsMessage = allowAdditionalUsers
    ? t("team.noSlots")
    : t("team.upgradeRequired");

  const submit = async () => {
    try {
      setLoading(true);
      await toastPromise(
        (async () => {
          const result = await adminApi.teams.inviteMember({ email, role });
          if (!result.ok) {
            throw new Error(result.code);
          }
          return result;
        })(),
        {
          success: t("team.inviteSent"),
          error: (err) => {
            if (!(err instanceof Error)) return t("common.toasts.error");
            if (err.message === "no_available_slots") return noSlotsMessage;
            if (err.message === "user_already_in_organization") {
              return t("team.inviteUserAlreadyInOrganization");
            }
            return t("common.toasts.error");
          },
        },
      );
      setEmail("");
      setRole("staff");
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={atCapacity}>
        <Plus /> {t("team.invite")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setEmail("");
            setRole("staff");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("team.invite")}</DialogTitle>
            <DialogDescription>{t("team.description")}</DialogDescription>
          </DialogHeader>
          {atCapacity ? (
            <TeamSeatsCapacityHint
              allowAdditionalUsers={allowAdditionalUsers}
            />
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="invite-email">{t("team.inviteEmail")}</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label>{t("team.inviteRole")}</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as typeof role)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                    <SelectItem value="coordinator">
                      {t("roles.coordinator")}
                    </SelectItem>
                    <SelectItem value="staff">{t("roles.staff")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("team.cancelInvite")}
            </Button>
            <Button onClick={submit} disabled={loading || !email || atCapacity}>
              {t("team.sendInvite")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
