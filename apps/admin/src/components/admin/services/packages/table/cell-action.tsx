"use client";
import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { AppointmentPackage } from "@hacado/types";
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
} from "@hacado/ui";
import { Edit, MoreHorizontal, ShoppingCart, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SellPackageDialog } from "../sell-dialog";

export const CellAction: React.FC<{ pkg: AppointmentPackage }> = ({ pkg }) => {
  const t = useI18n("admin");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    try {
      setLoading(true);
      await toastPromise(adminApi.packages.deletePackage(pkg._id), {
        success: t("services.packages.table.cellAction.packageDeleted", {
          name: pkg.name,
        }),
        error: t("services.packages.table.cellAction.deleteError"),
      });
      router.refresh();
    } finally {
      setLoading(false);
      setOpen(false);
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
      <SellPackageDialog
        open={sellOpen}
        onOpenChange={setSellOpen}
        pkg={pkg}
        onSuccess={(_customerPackageId, packageId) => {
          router.push(
            `/dashboard/services/packages/sold?packageId=${packageId}`,
          );
        }}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">
              {t("services.packages.table.cellAction.actions")}
            </span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {t("services.packages.table.cellAction.actions")}
          </DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/services/packages/${pkg._id}`}>
              <Edit className="mr-2 h-4 w-4" />
              {t("services.packages.table.cellAction.update")}
            </Link>
          </DropdownMenuItem>
          {pkg.status === "active" ? (
            <DropdownMenuItem onClick={() => setSellOpen(true)}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {t("services.packages.table.cellAction.sell")}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className="mr-2 h-4 w-4" />
            {t("services.packages.table.cellAction.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
