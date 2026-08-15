"use client";

import { useI18n } from "@hacado/i18n/client";
import { AutoSkeleton, toast } from "@hacado/ui";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getDesignById } from "../../actions";
import { DesignUpdateModel } from "../../models";
import {
  GiftCardStudioAdminKeys,
  GiftCardStudioAdminNamespace,
  giftCardStudioAdminNamespace,
} from "../../translations/types";
import { DesignForm } from "../components/design-form";

export const DesignNewPage = ({ appId }: { appId: string }) => {
  const params = useSearchParams();
  const fromId = params.get("from") as string;
  const t = useI18n<GiftCardStudioAdminNamespace, GiftCardStudioAdminKeys>(
    giftCardStudioAdminNamespace,
  );

  const [design, setDesign] = useState<DesignUpdateModel | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState(!!fromId);

  useEffect(() => {
    const fetchDesign = async () => {
      try {
        const data = await getDesignById(appId, fromId);
        if (data) {
          const { _id: _, createdAt: __, updatedAt: ___, ...designData } = data;
          setDesign(designData);
        }
      } catch (e) {
        toast.error(t("app.pages.edit.notFound"));
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (appId && fromId) fetchDesign();
  }, [appId, fromId, t]);

  return (
    <AutoSkeleton loading={loading}>
      <DesignForm initialData={design} appId={appId} />
    </AutoSkeleton>
  );
};
