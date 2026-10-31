"use client";

import { textMessagingApi } from "@hacado/api-sdk/admin/text-messaging";
import { useEffect, useState } from "react";

export function useCustomTextTemplatesAllowed() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    textMessagingApi
      .getTextMessagingAccess()
      .then((access) => {
        if (active) setAllowed(access.allowCustomTemplates);
      })
      .catch(() => {
        if (active) setAllowed(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return allowed;
}
