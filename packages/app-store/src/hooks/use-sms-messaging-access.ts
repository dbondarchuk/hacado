"use client";

import { adminApi } from "@hacado/api-sdk";
import type { SmsMessagingAccess } from "@hacado/types";
import { useEffect, useState } from "react";

export function useSmsMessagingAccess() {
  const [access, setAccess] = useState<SmsMessagingAccess | null>(null);

  useEffect(() => {
    let active = true;
    adminApi.textMessaging
      .getTextMessagingAccess()
      .then((value) => {
        if (active) setAccess(value);
      })
      .catch(() => {
        if (active) {
          setAccess({
            customVerified: false,
            canCustomize: false,
            platformBusiness: true,
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const allowCustom = Boolean(
    access && (access.customVerified || !access.platformBusiness),
  );
  const sharedPool = Boolean(
    access?.platformBusiness && !access.customVerified,
  );

  return { access, allowCustom, sharedPool };
}
