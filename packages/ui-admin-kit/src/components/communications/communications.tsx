"use client";

import { adminApi } from "@timelish/api-sdk";
import { useI18n, useLocale } from "@timelish/i18n/client";
import {
  CommunicationChannel,
  CommunicationDirection,
  CommunicationLog,
} from "@timelish/types";
import {
  Badge,
  Button,
  Skeleton,
  toast,
  TooltipResponsive,
  TooltipResponsiveContent,
  TooltipResponsiveTrigger,
  useIsMobile,
} from "@timelish/ui";
import { Mail, MailQuestion, MessageSquare, Send } from "lucide-react";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import React from "react";
import { useInView } from "react-intersection-observer";
import { CommunicationLogPayloadDialog } from "./communication-log-payload-dialog";
import { SendCommunicationDialog } from "./send-message-dialog";

const CommunicationEntry: React.FC<{ entry: CommunicationLog }> = ({
  entry,
}) => {
  const tAdmin = useI18n("admin");
  const t = useI18n();
  const dateTime = DateTime.fromJSDate(entry.dateTime);
  const locale = useLocale();
  const isMobile = useIsMobile();
  return (
    <div className="w-full rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0">
            {entry.channel === "email" ? (
              <Mail className="size-5 text-muted-foreground" />
            ) : entry.channel === "text-message" ? (
              <MessageSquare className="size-5 text-muted-foreground" />
            ) : (
              <MailQuestion className="size-5 text-muted-foreground" />
            )}
          </div>
          <p className="font-medium text-base truncate">
            {entry.subject ??
              t(
                typeof entry.handledBy === "string"
                  ? entry.handledBy
                  : entry.handledBy.key,
                typeof entry.handledBy === "object" && entry.handledBy.args
                  ? entry.handledBy.args
                  : undefined,
              )}
          </p>
        </div>
        <TooltipResponsive>
          <TooltipResponsiveTrigger>
            <span className="text-sm text-muted-foreground underline decoration-dashed cursor-help">
              {dateTime.setLocale(locale).toRelative()}
            </span>
          </TooltipResponsiveTrigger>
          <TooltipResponsiveContent side={isMobile ? "bottom" : "left"}>
            {dateTime.toLocaleString(DateTime.DATETIME_MED, { locale })}
          </TooltipResponsiveContent>
        </TooltipResponsive>
      </div>
      <div className="p-4 pt-3">
        <div className="inline-flex gap-1 text-base flex-wrap w-full">
          <span className="break-all text-sm">
            {entry.preview.length > 200
              ? entry.preview.substring(0, 200) + "..."
              : entry.preview}
          </span>
          <CommunicationLogPayloadDialog
            logId={entry._id}
            channel={entry.channel}
            mode="body"
            title={tAdmin("communications.logContent")}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-1 py-0 text-sm text-muted-foreground hover:text-foreground"
              >
                {tAdmin("communications.viewMore")}
              </Button>
            }
          />
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge variant="outline" className="text-sm">
            {tAdmin(`common.labels.channel.${entry.channel}`)}
          </Badge>
          <Badge variant="secondary" className="text-sm">
            {tAdmin(`common.labels.direction.${entry.direction}`)}
          </Badge>
          <Badge variant="outline" className="text-sm">
            {tAdmin("communications.handler", {
              handler: t(
                typeof entry.handledBy === "object"
                  ? entry.handledBy.key
                  : entry.handledBy,
                typeof entry.handledBy === "object" && entry.handledBy.args
                  ? entry.handledBy.args
                  : undefined,
              ),
            })}
          </Badge>
          {entry.participant && (
            <Badge variant="outline" className="text-sm">
              {tAdmin("communications.participant", {
                participant: entry.participant,
              })}
            </Badge>
          )}
          {entry.hasPayloadData && (
            <div className="flex flex-col gap-1">
              <CommunicationLogPayloadDialog
                logId={entry._id}
                channel={entry.channel}
                mode="data"
                title={tAdmin("communications.logData")}
                triggerAsChild={false}
                trigger={
                  <Badge variant="default" className="cursor-pointer">
                    {tAdmin("communications.data")}
                  </Badge>
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CommunicationEntrySkeleton: React.FC<{ length?: number }> = ({
  length = 3,
}) => {
  return Array.from({ length }).map((_, index) => (
    <div key={index} className="w-full rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3 min-w-0">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="w-32 h-5" />
        </div>
        <Skeleton className="w-16 h-4" />
      </div>
      <div className="p-4 pt-3">
        <Skeleton className="w-full h-10" />
        <div className="flex items-center space-x-2 mt-3 flex-wrap">
          <Skeleton className="w-14 h-6" />
          <Skeleton className="w-14 h-6" />
          <Skeleton className="w-14 h-6" />
          <Skeleton className="w-14 h-6" />
          <Skeleton className="w-14 h-6" />
        </div>
      </div>
    </div>
  ));
};

export type CustomerOrAppointment =
  | {
      customerId: string;
    }
  | {
      appointmentId: string;
    };

export const SendCommunicationButton: React.FC<CustomerOrAppointment> = (
  props,
) => {
  const t = useI18n("admin");
  const router = useRouter();
  return (
    <SendCommunicationDialog
      {...props}
      onSuccess={() => router.replace(`?key=${new Date().getTime()}`)}
    >
      <Button variant="primary" aria-label={t("communications.sendNew")}>
        <Send />
        <span className="max-md:hidden">{t("communications.sendNew")}</span>
      </Button>
    </SendCommunicationDialog>
  );
};

const toLoad = 10;

export type RecentCommunicationsProps = {
  direction?: CommunicationDirection[];
  channel?: CommunicationChannel[];
  start?: Date | null;
  end?: Date | null;
  search?: string | null;
} & CustomerOrAppointment;

export const RecentCommunications: React.FC<RecentCommunicationsProps> = ({
  direction,
  channel,
  start,
  end,
  search,
  ...rest
}) => {
  const t = useI18n("admin");
  const [logs, setLogs] = React.useState<CommunicationLog[]>([]);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const [initialLoad, setInitialLoad] = React.useState(true);
  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  const customerId = "customerId" in rest ? rest.customerId : undefined;
  const appointmentId =
    "appointmentId" in rest ? rest.appointmentId : undefined;

  const loadLogs = React.useCallback(
    async (page: number) => {
      const result = await adminApi.communicationLogs.getCommunicationLogs({
        participantType: ["customer"],
        page,
        limit: toLoad,
        customer: customerId ? [customerId] : undefined,
        appointmentId,
        direction,
        channel,
        start,
        end,
        search,
      });

      return {
        items: result.items,
        hasMore: page * toLoad < result.total,
      };
    },
    [customerId, appointmentId, direction, channel, start, end, search],
  );

  React.useEffect(() => {
    setPage(1);
    setHasMore(true);
    setInitialLoad(false);
    setLogs([]);
  }, [customerId, channel, direction, start, end, search]);

  React.useEffect(() => {
    const loadItems = async () => {
      if (!hasMore && !initialLoad) return;

      setLoading(true);
      try {
        const result = await loadLogs(page);

        if (page === 1) {
          setLogs(result.items);
        } else {
          setLogs((prev) => [...prev, ...result.items]);
        }

        setHasMore(result.hasMore);
        setInitialLoad(false);
      } catch (error) {
        console.error("Failed to fetch items:", error);
        toast.error(t("communications.requestError"));
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [page, loadLogs, initialLoad, hasMore]);

  React.useEffect(() => {
    if (inView && !loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  }, [inView, loading, hasMore]);

  return (
    <div className="grid grid-cols-1 gap-2 py-2">
      {loading && page === 1 && <CommunicationEntrySkeleton />}
      {logs?.map((log) => <CommunicationEntry entry={log} key={log._id} />)}
      {hasMore && !loading && <div ref={ref} className="h-1" />}
      {loading && page > 1 && <CommunicationEntrySkeleton />}
    </div>
  );
};
