"use client";
import { adminApi } from "@timelish/api-sdk";
import { useI18n } from "@timelish/i18n/client";
import { CustomerListModel } from "@timelish/types";
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
import { Edit, MoreHorizontal, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import Link from "next/link";

interface CellActionProps {
  customer: CustomerListModel;
}

export const CellAction: React.FC<CellActionProps> = ({ customer }) => {
  const t = useI18n("admin");
  const { user } = useAuth();
  const canUpdate = hasPermission(user, "customer", "update");
  const canDelete = hasPermission(user, "customer", "delete");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if ((!canUpdate && !canDelete) || customer.isDeleted) {
    return null;
  }

  const onConfirm = async () => {
    try {
      setLoading(true);

      await toastPromise(adminApi.customers.deleteCustomer(customer._id), {
        success: t("customers.toasts.customerDeleted", { name: customer.name }),
        error: t("customers.table.delete.error"),
      });

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
            <span className="sr-only">
              {t("customers.table.actions.openMenu")}
            </span>
            <MoreHorizontal className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {t("customers.table.actions.actions")}
          </DropdownMenuLabel>
          {canUpdate ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/customers/${customer._id}`}
                  className="text-foreground"
                >
                  <Edit className="size-3.5" />{" "}
                  {t("customers.table.actions.edit")}
                </Link>
              </DropdownMenuItem>
            </>
          ) : null}
          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOpen(true)}>
                <Trash className="size-3.5" />{" "}
                {t("customers.table.actions.delete")}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
