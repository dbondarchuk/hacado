"use client";

import { useI18n } from "@hacado/i18n/client";
import { Card, CardContent, CardHeader } from "@hacado/ui";
import { AlertCircle } from "lucide-react";
import {
  FormsPublicKeys,
  FormsPublicNamespace,
  formsPublicNamespace,
} from "../../translations/types";

export const FormNotFoundWarning: React.FC = () => {
  const t = useI18n<FormsPublicNamespace, FormsPublicKeys>(
    formsPublicNamespace,
  );

  return (
    <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 forms-form-not-found">
      <CardHeader className="flex flex-row items-center gap-2 pb-2 forms-form-not-found-header">
        <AlertCircle className="h-4 w-4 shrink-0 forms-form-not-found-icon" />
        <span className="font-medium forms-form-not-found-title">
          {t("block.formNotFound.title" as FormsPublicKeys)}
        </span>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-muted-foreground forms-form-not-found-description">
        {t("block.formNotFound.description" as FormsPublicKeys)}
      </CardContent>
    </Card>
  );
};
