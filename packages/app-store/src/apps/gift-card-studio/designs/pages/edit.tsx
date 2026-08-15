"use client";

import { useI18n } from "@hacado/i18n/client";
import { AutoSkeleton } from "@hacado/ui";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getDesignById } from "../../actions";
import { DesignModel } from "../../models";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { DesignForm } from "../components/design-form";

export const DesignEditPage = ({ appId }: { appId: string }) => {
  const params = useSearchParams();
  const designId = params.get("id") as string;
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );

  const [design, setDesign] = useState<DesignModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDesign = async () => {
      try {
        const data = await getDesignById(appId, designId);
        setDesign(data ?? null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (appId && designId) fetchDesign();
  }, [appId, designId]);

  if (loading) {
    return (
      <AutoSkeleton loading>
        <DesignForm appId={appId} />
      </AutoSkeleton>
    );
  }

  if (!design) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">{t("app.pages.edit.notFound")}</p>
      </div>
    );
  }

  return <DesignForm initialData={design} appId={appId} />;
};
