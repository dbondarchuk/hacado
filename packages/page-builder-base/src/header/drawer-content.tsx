"use client";

import { usePortalContext } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import {
  Button,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@hacado/ui";
import { Menu, X } from "lucide-react";
import { ReplaceOriginalColors } from "../helpers/replace-original-colors";
import { blockPreviewLinkNavigation } from "./preview-navigation";

export const PortalDrawerContent = ({
  className,
  children,
  preview,
}: {
  className: string;
  children: React.ReactNode;
  preview?: boolean;
}) => {
  const { body } = usePortalContext();
  return (
    <DrawerContent
      className={className}
      container={body}
      onClickCapture={preview ? blockPreviewLinkNavigation : undefined}
      onAuxClickCapture={preview ? blockPreviewLinkNavigation : undefined}
      onKeyDownCapture={preview ? blockPreviewLinkNavigation : undefined}
    >
      <ReplaceOriginalColors />
      {children}
    </DrawerContent>
  );
};

export const HeaderDrawerHeader = () => {
  const t = useI18n("translation");
  return (
    <DrawerHeader className="flex flex-row gap-2 items-center shrink-0">
      <DrawerTitle className="text-base">{t("header.menu")}</DrawerTitle>
      <DrawerClose asChild className="">
        <Button
          variant="ghost"
          size="icon"
          className="w-fit ml-auto"
          aria-label={t("header.close")}
        >
          <X />
        </Button>
      </DrawerClose>
    </DrawerHeader>
  );
};

export const HeaderDrawerTrigger = () => {
  const t = useI18n("translation");
  return (
    <DrawerTrigger asChild>
      <Button
        variant="outline"
        className="text-foreground"
        aria-label={t("header.menu")}
      >
        <Menu />
      </Button>
    </DrawerTrigger>
  );
};
