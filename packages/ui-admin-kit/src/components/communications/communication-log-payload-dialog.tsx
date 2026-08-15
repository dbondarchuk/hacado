"use client";

import { adminApi } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import {
  CommunicationChannel,
  CommunicationLogContentPayload,
} from "@hacado/types";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  IFrame,
  Markdown,
  Skeleton,
  toast,
} from "@hacado/ui";
import JsonView from "@uiw/react-json-view";
import * as React from "react";

type ViewMode = "body" | "data";

export type CommunicationLogPayloadDialogProps = {
  logId: string;
  channel: CommunicationChannel;
  mode: ViewMode;
  trigger: React.ReactNode;
  title: string;
  /** When false, the trigger is wrapped in a native trigger (e.g. for Badge). */
  triggerAsChild?: boolean;
};

export const CommunicationLogPayloadDialog: React.FC<
  CommunicationLogPayloadDialogProps
> = ({ logId, channel, mode, trigger, title, triggerAsChild = true }) => {
  const tAdmin = useI18n("admin");
  const [open, setOpen] = React.useState(false);
  const [payload, setPayload] =
    React.useState<CommunicationLogContentPayload | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    adminApi.communicationLogs
      .getCommunicationLogContent(logId)
      .then((data) => {
        if (!cancelled) {
          setPayload(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error(tAdmin("communications.payloadLoadError"));
          setPayload(null);
          setOpen(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, logId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerAsChild ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger>{trigger}</DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[80%] flex flex-col max-h-[100%]">
        <DialogHeader>
          <DialogTitle className="w-full flex flex-row justify-between items-center mt-2">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 w-full overflow-auto">
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : mode === "data" ? (
            payload?.data !== undefined ? (
              <JsonView
                value={
                  typeof payload.data === "object" && payload.data !== null
                    ? (payload.data as object)
                    : { value: payload.data as string | number | boolean }
                }
              />
            ) : null
          ) : channel === "email" && payload?.html ? (
            <IFrame className="w-full h-[80vh]">
              <div dangerouslySetInnerHTML={{ __html: payload.html }} />
            </IFrame>
          ) : (
            <Markdown markdown={payload?.text ?? ""} className="not-prose" />
          )}
        </div>
        <DialogFooter className="flex-row !justify-between gap-2">
          <DialogClose asChild>
            <Button variant="secondary">
              {tAdmin("common.buttons.close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
