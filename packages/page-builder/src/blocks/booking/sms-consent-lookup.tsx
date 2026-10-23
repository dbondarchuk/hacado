"use client";

import { createContext } from "react";

export const SmsConsentLookupContext = createContext<
  ((phone: string) => Promise<boolean>) | null
>(null);
