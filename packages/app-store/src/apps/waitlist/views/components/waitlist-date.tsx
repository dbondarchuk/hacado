import { useI18n, useLocale } from "@hacado/i18n/client";
import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  ScrollArea,
  useTimeZone,
} from "@hacado/ui";
import { DateTime } from "luxon";
import { WaitlistEntry } from "../../models";
import {
  WaitlistAdminKeys,
  waitlistAdminNamespace,
  WaitlistAdminNamespace,
} from "../../translations/types";

export const WaitlistDate = ({ entry }: { entry: WaitlistEntry }) => {
  const t = useI18n<WaitlistAdminNamespace, WaitlistAdminKeys>(
    waitlistAdminNamespace,
  );

  const tAdmin = useI18n("admin");

  const locale = useLocale();
  const timeZone = useTimeZone();

  return (
    <>
      {entry.asSoonAsPossible ? (
        t("view.asSoonAsPossible")
      ) : (
        <div className="flex flex-col gap-2 w-full">
          {entry.dates
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 3)
            .map((dateEntry, index) => (
              <div key={index} className="space-y-1">
                <p className="text-xs font-medium">
                  {DateTime.fromISO(dateEntry.date, {
                    zone: timeZone,
                  })
                    .setLocale(locale)
                    .toLocaleString(DateTime.DATE_MED)}
                </p>
                <div className="flex flex-wrap gap-1">
                  {dateEntry.time.map((timeSlot) => (
                    <Badge
                      key={timeSlot}
                      variant="outline"
                      className="text-xs "
                    >
                      {t(`view.times.short.${timeSlot}`)}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          {entry.dates.length > 3 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="link-dashed">{t("view.viewAll")}</Button>
              </DialogTrigger>
              <DialogContent
                className="flex flex-col max-h-full"
                overlayVariant="blur"
              >
                <DialogHeader>
                  <DialogTitle>{t("view.dates")}</DialogTitle>
                </DialogHeader>
                <div className="grid">
                  <ScrollArea className="max-h-[60vh]">
                    <div className="flex flex-col gap-2">
                      {entry.dates
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((dateEntry, index) => (
                          <div key={index} className="space-y-1">
                            <p className="text-sm font-medium">
                              {DateTime.fromISO(dateEntry.date, {
                                zone: timeZone,
                              })
                                .setLocale(locale)
                                .toLocaleString(DateTime.DATE_HUGE)}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {dateEntry.time.map((timeSlot) => (
                                <Badge
                                  key={timeSlot}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {t(`view.times.descriptions.${timeSlot}`)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="secondary">
                      {tAdmin("common.buttons.close")}
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </>
  );
};
