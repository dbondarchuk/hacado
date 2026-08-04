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
import { useNavigationGuard } from "next-navigation-guard";
import { RefObject, useCallback, useEffect, useRef } from "react";
import { UseFormReturn, useFormState } from "react-hook-form";

export const useIsDirty = (form: UseFormReturn<any>) => {
  const { isDirty } = useFormState({ control: form.control });

  const isFormDirty = useRef(isDirty);
  useEffect(() => {
    isFormDirty.current = isDirty;
  }, [isDirty]);

  const onFormSubmit = useCallback(() => {
    form.reset(form.getValues());
    isFormDirty.current = false;
  }, [form]);

  return { isFormDirty: isFormDirty, onFormSubmit };
};

export const NavigationGuardDialog = ({
  isDirty,
}: {
  isDirty: boolean | RefObject<boolean>;
}) => {
  const t = useI18n("admin");

  const { active, accept, reject } = useNavigationGuard({
    enabled: () => (typeof isDirty === "boolean" ? isDirty : isDirty.current),
  });

  return (
    <Dialog open={active}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("common.navigationGuard.title")}</DialogTitle>
        </DialogHeader>
        <div>{t("common.navigationGuard.description")}</div>
        <DialogFooter>
          <Button variant="outline" onClick={reject}>
            {t("common.navigationGuard.cancel")}
          </Button>
          <Button onClick={accept}>{t("common.navigationGuard.leave")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
