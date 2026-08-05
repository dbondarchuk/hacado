"use client";

import { adminApi } from "@hacado/api-sdk";
import { useCallback, useEffect, useState } from "react";
import { FormModel } from "../../models";
import { GetFormByIdActionType } from "../../models/app";

type State =
  | { status: "idle"; form: null; error: null }
  | { status: "loading"; form: null; error: null }
  | { status: "success"; form: FormModel; error: null }
  | { status: "error"; form: null; error: Error };

/**
 * Fetches form by appId and formId via the admin process API.
 * Intended for use in the page builder editor (admin app) where /api/apps/[id]/process is available.
 */
export function useFormById(
  appId: string | undefined,
  formId: string | null,
): State & { refetch: () => void } {
  const [state, setState] = useState<State>({
    status: "idle",
    form: null,
    error: null,
  });

  const fetchForm = useCallback(async () => {
    if (!appId || !formId) {
      setState({ status: "idle", form: null, error: null });
      return;
    }

    setState({ status: "loading", form: null, error: null });

    try {
      const res = await adminApi.apps.processRequest<FormModel>(appId, {
        type: GetFormByIdActionType,
        id: formId,
      });

      if (!res || !res.fields) {
        setState({
          status: "error",
          form: null,
          error:
            "message" in res
              ? new Error(res.message as string)
              : new Error("Failed to load form"),
        });
        return;
      }

      setState({ status: "success", form: res, error: null });
    } catch (err) {
      setState({
        status: "error",
        form: null,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, [appId, formId]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  return { ...state, refetch: fetchForm };
}
