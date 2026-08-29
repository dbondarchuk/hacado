"use client";

import { useI18n } from "@hacado/i18n/client";
import { toast } from "@hacado/ui";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

function showToast(type: string | null, message: string) {
  switch (type) {
    case "info":
      toast.info(message);
      return;
    case "error":
      toast.error(message);
      return;
    case "warning":
      toast.warning(message);
      return;
    default:
      toast.success(message);
  }
}

export function ToastFromQuery() {
  const t = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const key = searchParams.get("toast");
    if (!key) {
      return;
    }

    showToast(
      searchParams.get("toastType"),
      t.has(key as never) ? t(key as never) : key,
    );

    const next = new URLSearchParams(searchParams.toString());
    next.delete("toast");
    next.delete("toastType");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams, t]);

  return null;
}
