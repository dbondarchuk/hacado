"use client";

import { Skeleton } from "@hacado/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { dismissWaitlistEntry } from "../views/components/actions";

export const WaitlistDismissPage: React.FC<{ appId: string }> = ({ appId }) => {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");
  const router = useRouter();
  useEffect(() => {
    if (!id) {
      router.replace("/dashboard/waitlist");
      return;
    }

    const fn = async () => {
      await dismissWaitlistEntry(appId, id);
      router.replace("/dashboard/waitlist");
    };

    fn();
  }, [id]);
  return <Skeleton className="w-full h-[70vh]" />;
};
