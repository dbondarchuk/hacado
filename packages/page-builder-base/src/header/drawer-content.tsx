"use client";

import { usePortalContext } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import {
  Button,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@timelish/ui";
import { Menu, X } from "lucide-react";
import { ReplaceOriginalColors } from "../helpers/replace-original-colors";

export const PortalDrawerContent = ({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) => {
  const { body } = usePortalContext();
  return (
    <DrawerContent className={className} container={body}>
      <ReplaceOriginalColors />
      {children}
    </DrawerContent>
  );
};

export const HeaderDrawerHeader = () => {
  const t = useI18n("translation");
  return (
    <DrawerHeader className="flex flex-row gap-2 items-center">
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
      <Button variant="outline" aria-label={t("header.menu")}>
        <Menu />
      </Button>
    </DrawerTrigger>
  );
};
