"use client";

import { useI18n } from "@timelish/i18n/client";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@timelish/ui";
import React, { useEffect, useState } from "react";
import { FormSelector } from "../../components/form-selector";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";

export const SelectFormDialog: React.FC<{
  appId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (formId: string) => void;
  selectedFormId?: string;
}> = ({
  appId,
  open,
  onOpenChange,
  onSelect,
  selectedFormId: initialSelectedFormId,
}) => {
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);
  const [selectedFormId, setSelectedFormId] = useState<string | undefined>(
    initialSelectedFormId,
  );

  const handleOpenChange = (next: boolean) => {
    if (!next) setSelectedFormId(undefined);

    onOpenChange(next);
  };

  useEffect(() => {
    if (initialSelectedFormId && open) {
      setSelectedFormId(initialSelectedFormId);
    }
  }, [initialSelectedFormId, open]);

  const handleContinue = () => {
    if (selectedFormId) {
      onSelect(selectedFormId);
      handleOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("responses.new.selectForm")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <FormSelector
            appId={appId}
            value={selectedFormId}
            onItemSelect={setSelectedFormId}
            allowClear
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t("responses.dialog.cancel")}
          </Button>
          <Button onClick={handleContinue} disabled={!selectedFormId}>
            {t("responses.dialog.continue")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
