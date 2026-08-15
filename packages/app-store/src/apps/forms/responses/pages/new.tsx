"use client";

import { useI18n } from "@hacado/i18n/client";
import { Breadcrumbs, Card, CardContent, CardHeader, Label } from "@hacado/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getFormById } from "../../actions";
import { FormSelector } from "../../components/form-selector";
import { FormModel } from "../../models";
import {
  FormsAdminKeys,
  FormsAdminNamespace,
  formsAdminNamespace,
} from "../../translations/types";
import { ResponseForm } from "../components/response-form";

export const ResponseNewPage = ({ appId }: { appId: string }) => {
  const params = useSearchParams();
  const formIdParam = params.get("formId");
  const customerIdParam = params.get("customerId");
  const returnUrlParam = params.get("returnUrl");
  const t = useI18n<FormsAdminNamespace, FormsAdminKeys>(formsAdminNamespace);
  const tAdmin = useI18n("admin");
  const router = useRouter();

  const [form, setForm] = useState<FormModel | null>(null);
  const [loading, setLoading] = useState(!!formIdParam);

  useEffect(() => {
    if (!formIdParam) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getFormById(appId, formIdParam)
      .then((f) => setForm(f))
      .catch(() => setForm(null))
      .finally(() => setLoading(false));
  }, [appId, formIdParam]);

  const handleFormSelect = (formId: string) => {
    router.replace(`/dashboard/forms/responses/new?formId=${formId}`);
  };

  const breadcrumbItems = [
    { title: tAdmin("navigation.dashboard"), link: "/dashboard" },
    { title: t("app.displayName"), link: "/dashboard/forms" },
    {
      title: t("app.pages.responses.title"),
      link: "/dashboard/forms/responses",
    },
    { title: t("responses.new.title"), link: "/dashboard/forms/responses/new" },
  ];

  if (loading) {
    return null;
  }

  if (!formIdParam) {
    return (
      <div className="w-full h-full space-y-8">
        <Breadcrumbs items={breadcrumbItems} />
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium">
              {t("responses.new.selectForm")}
            </h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 max-w-sm">
              <Label>{t("responses.new.formLabel")}</Label>
              <FormSelector
                appId={appId}
                onItemSelect={(id) => id && handleFormSelect(id)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="w-full h-full space-y-8">
        <Breadcrumbs items={breadcrumbItems} />
        <p className="text-muted-foreground">{t("responses.edit.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full space-y-8">
      <ResponseForm
        form={form}
        appId={appId}
        initialCustomerId={customerIdParam}
        returnUrl={returnUrlParam ?? undefined}
      />
    </div>
  );
};
