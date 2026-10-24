"use client";

import { adminApi } from "@hacado/api-sdk";
import { useEffect, useState } from "react";

export function useCustomTextTemplatesAllowed() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    adminApi.textMessaging
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
