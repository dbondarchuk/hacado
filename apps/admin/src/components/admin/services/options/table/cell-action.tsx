"use client";
import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { AppointmentOption } from "@timelish/types";
import {
  AlertModal,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  toastPromise,
} from "@timelish/ui";
import { useAuth } from "@timelish/ui-admin";
import { hasPermission } from "@timelish/utils";
import { Copy, Edit, MoreHorizontal, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import Link from "next/link";

interface CellActionProps {
  option: AppointmentOption;
}

export const CellAction: React.FC<CellActionProps> = ({ option }) => {
  const t = useI18n("admin");
  const { user } = useAuth();
  const canCreate = hasPermission(user, "service", "create");
  const canUpdate = hasPermission(user, "service", "update");
  const canDelete = hasPermission(user, "service", "delete");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (!canCreate && !canUpdate && !canDelete) {
    return null;
  }

  const onConfirm = async () => {
    try {
      setLoading(true);

      await toastPromise(
        adminApi.serviceOptions.deleteServiceOption(option._id),
        {
          success: t(
            "services.options.table.columns.cellAction.optionDeleted",
            {
              name: option.name,
            },
          ),
          error: t("services.options.table.columns.cellAction.deleteError"),
        },
      );

      setOpen(false);
      router.refresh();
    } catch (error: any) {
      setLoading(false);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">{t("common.openMenu")}</span>
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {t("services.options.table.columns.cellAction.actions")}
          </DropdownMenuLabel>
          {canCreate ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/services/options/new?from=${option._id}`}
                  className="text-foreground"
                >
                  <Copy className="size-3.5" />{" "}
                  {t("services.options.table.columns.cellAction.clone")}
                </Link>
              </DropdownMenuItem>
            </>
          ) : null}
          {canUpdate ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/services/options/${option._id}`}
                  className="text-foreground"
                >
                  <Edit className="size-3.5" />{" "}
                  {t("services.options.table.columns.cellAction.update")}
                </Link>
              </DropdownMenuItem>
            </>
          ) : null}
          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOpen(true)}>
                <Trash className="size-3.5" />{" "}
                {t("services.options.table.columns.cellAction.delete")}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
