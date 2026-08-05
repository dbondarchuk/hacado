"use client";

import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ScrollArea,
} from "@hacado/ui";
import { Settings } from "lucide-react";
import { useState } from "react";
import { WaitlistAppSetup } from "../setup";
import {
  WaitlistAdminKeys,
  WaitlistAdminNamespace,
  waitlistAdminNamespace,
} from "../translations/types";

export const SettingsDialog = ({ appId }: { appId: string }) => {
  const t = useI18n<WaitlistAdminNamespace, WaitlistAdminKeys>(
    waitlistAdminNamespace,
  );

  const [isOpen, setIsOpen] = useState(false);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" aria-label={t("settings.tooltip")}>
          <Settings className="size-4" />
          <span className="max-md:hidden">{t("settings.tooltip")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("settings.title")}</DialogTitle>
          <DialogDescription>{t("settings.description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <ScrollArea className="max-h-[60vh]">
            <WaitlistAppSetup
              appId={appId}
              onSuccess={() => {
                setIsOpen(false);
              }}
              onError={() => {}}
            />
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
