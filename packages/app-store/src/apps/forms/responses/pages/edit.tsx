"use client";

import { useI18n } from "@timelish/i18n/client";
import { Spinner } from "@timelish/ui";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getFormById, getFormResponseById } from "../../actions";
import { FormModel, FormResponseModel } from "../../models";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";
import { ResponseForm } from "../components/response-form";

export const ResponseEditPage = ({ appId }: { appId: string }) => {
  const params = useSearchParams();
  const id = params.get("id") as string;
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);

  const [response, setResponse] = useState<FormResponseModel | null>(null);
  const [form, setForm] = useState<FormModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appId || !id) {
      setLoading(false);
      return;
    }
    const run = async () => {
      try {
        const resData = await getFormResponseById(appId, id);
        if (resData) {
          setResponse(resData);
          const formRes = await getFormById(appId, resData.formId);
          setForm(formRes);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [appId, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  if (!response || !form) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">{t("responses.edit.notFound")}</p>
      </div>
    );
  }

  return <ResponseForm form={form} appId={appId} response={response} />;
};
