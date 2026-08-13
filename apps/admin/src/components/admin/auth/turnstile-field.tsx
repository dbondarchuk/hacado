"use client";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useCallback, useRef, useState, type RefObject } from "react";

export function useTurnstileField() {
  const widgetRef = useRef<TurnstileInstance | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const reset = useCallback(() => {
    setToken(null);
    widgetRef.current?.reset();
  }, []);

  return { token, setToken, widgetRef, reset };
}

export function TurnstileField({
  siteKey,
  widgetRef,
  onTokenChange,
}: {
  siteKey: string;
  widgetRef: RefObject<TurnstileInstance | null>;
  onTokenChange: (token: string | null) => void;
}) {
  if (!siteKey) {
    return null;
  }

  return (
    <div className="flex justify-center py-1">
      <Turnstile
        ref={widgetRef}
        siteKey={siteKey}
        onSuccess={onTokenChange}
        onExpire={() => {
          onTokenChange(null);
          widgetRef.current?.reset();
        }}
        onError={() => onTokenChange(null)}
      />
    </div>
  );
}

export function captchaFetchOptions(token: string) {
  return {
    headers: {
      "x-captcha-response": token,
    } as Record<string, string>,
  };
}

export function isCaptchaError(
  error?: {
    code?: string | null;
    message?: string | null;
  } | null,
) {
  const code = error?.code?.toUpperCase() ?? "";
  const message = error?.message?.toLowerCase() ?? "";
  return (
    code === "VERIFICATION_FAILED" ||
    code === "MISSING_RESPONSE" ||
    code.includes("CAPTCHA") ||
    message.includes("captcha")
  );
}
