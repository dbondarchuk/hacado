"use client";

import { useI18n } from "@timelish/i18n/client";
import { AlertCircle } from "lucide-react";

export const NoImagesMessage = () => {
  const t = useI18n("builder");
  return (
    <div className="flex items-center justify-center h-full">
      <AlertCircle className="w-10 h-10 text-red-500" />
      <p className="text-red-500">
        {t("pageBuilder.blocks.beforeAfterSlider.noImages")}
      </p>
    </div>
  );
};
