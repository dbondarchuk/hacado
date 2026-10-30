"use client";

import { textMessagingApi } from "@hacado/api-sdk/admin/text-messaging";
import type { SmsMessagingAccess } from "@hacado/types/text-message/registration";
import { useEffect, useState } from "react";

export function useSmsMessagingAccess() {
  const [access, setAccess] = useState<SmsMessagingAccess | null>(null);

  useEffect(() => {
    let active = true;
    textMessagingApi
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
            allowCustomTemplates: false,
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const allowCustom = Boolean(access?.allowCustomTemplates);
  const sharedPool = Boolean(
    access?.platformBusiness && !access.customVerified,
  );

  return { access, allowCustom, sharedPool };
}
