"use client";
import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import { TemplateListModel } from "@hacado/types";
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
import { Copy, Edit, MoreHorizontal, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CellActionProps {
  template: TemplateListModel;
}

export const CellAction: React.FC<CellActionProps> = ({ template }) => {
  const t = useI18n("admin");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const onConfirm = async () => {
    try {
      setLoading(true);

      await toastPromise(adminApi.templates.deleteTemplate(template._id), {
        success: t("templates.table.cellAction.templateDeleted", {
          name: template.name,
        }),
        error: t("templates.table.cellAction.deleteError"),
      });

      router.refresh();
      setOpen(false);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-right">
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
            {t("templates.table.cellAction.actions")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/templates/${template._id}`}
              className="text-foreground"
            >
              <Edit className="size-3.5" />{" "}
              {t("templates.table.cellAction.update")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/templates/new/${template.type}?cloneFrom=${template._id}`}
              className="text-foreground"
            >
              <Copy className="size-3.5" />{" "}
              {t("templates.table.cellAction.clone")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Trash className="size-3.5" />{" "}
            {t("templates.table.cellAction.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
