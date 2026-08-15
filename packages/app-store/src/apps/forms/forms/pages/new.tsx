"use client";

import { AutoSkeleton } from "@hacado/ui";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getFormById } from "../../actions";
import { FormUpdateModel } from "../../models";
import { FormEditForm } from "../components/form";

export const FormsNewPage = ({ appId }: { appId: string }) => {
  const params = useSearchParams();
  const fromId = params.get("from") as string;

  const [form, setForm] = useState<FormUpdateModel | undefined>(undefined);
  const [loading, setLoading] = useState(!!fromId);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const data = await getFormById(appId, fromId);
        const {
          _id: _,
          createdAt: __,
          updatedAt: ___,
          isArchived: ____,
          ...formData
        } = data;
        setForm(formData);
      } catch (error) {
        console.error("Error fetching form:", error);
      } finally {
        setLoading(false);
      }
    };

    if (appId && fromId) {
      fetchForm();
    }
  }, [appId, fromId]);

  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center h-full">
  //       <Spinner />
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col flex-1 gap-8">
      <AutoSkeleton loading={loading}>
        <FormEditForm initialData={form} appId={appId} />
      </AutoSkeleton>
    </div>
  );
};
