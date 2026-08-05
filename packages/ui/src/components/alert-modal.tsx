"use client";
import { useI18n } from "@hacado/i18n/client";
import { useEffect, useState } from "react";
import { Button } from "./button";
import { Modal } from "./modal";
import { Spinner } from "./spinner";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  description?: string;
  continueButton?: string;
  cancelButton?: string;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
  title,
  description,
  continueButton,
  cancelButton,
}) => {
  const t = useI18n("ui");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Modal
      title={title || t("alertModal.defaultTitle")}
      description={description || t("alertModal.defaultDescription")}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="flex w-full items-center justify-end space-x-2 pt-6">
        <Button disabled={loading} variant="outline" onClick={onClose}>
          {cancelButton || t("common.cancel")}
        </Button>
        <Button
          disabled={loading}
          variant="destructive"
          onClick={onConfirm}
          className="flex flex-row gap-1 items-center"
        >
          {loading && <Spinner />}
          <span>{continueButton || t("alertModal.continueButton")}</span>
        </Button>
      </div>
    </Modal>
  );
};
