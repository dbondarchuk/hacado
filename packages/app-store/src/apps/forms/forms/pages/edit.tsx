"use client";

import { useI18n } from "@timelish/i18n/client";
import { AutoSkeleton, toast } from "@timelish/ui";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getFormById } from "../../actions";
import { FormModel } from "../../models";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";
import { FormEditForm } from "../components/form";

export const FormsEditPage = ({ appId }: { appId: string }) => {
  const params = useSearchParams();
  const formId = params.get("id") as string;
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);

  const [form, setForm] = useState<FormModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const data = await getFormById(appId, formId);
        setForm(data);
      } catch (error) {
        toast.error(t("app.pages.edit.notFound"));
        console.error("Error fetching form:", error);
      } finally {
        setLoading(false);
      }
    };

    if (appId && formId) {
      fetchForm();
    }
  }, [appId, formId]);

  if (loading) {
    return (
      <div className="flex flex-col flex-1 gap-8">
        <AutoSkeleton loading>
          <FormEditForm appId={appId} />
        </AutoSkeleton>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">{t("app.pages.edit.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 gap-8">
      <FormEditForm initialData={form} appId={appId} />
    </div>
  );
};
