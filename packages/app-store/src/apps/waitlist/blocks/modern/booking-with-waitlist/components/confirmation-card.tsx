import { useFormatter, useI18n, useLocale } from "@hacado/i18n/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  useCurrencyFormat,
  useTimeZone,
} from "@hacado/ui";
import { durationToTime } from "@hacado/utils";
import { CheckCircle2 } from "lucide-react";
import { DateTime } from "luxon";
import { formatDateRange, groupWaitlistDates } from "../../../../models/utils";
import {
  WaitlistPublicKeys,
  WaitlistPublicNamespace,
  waitlistPublicNamespace,
} from "../../../../translations/types";
import { useScheduleContext } from "./context";

export const ConfirmationCard: React.FC = () => {
  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();
  const t = useI18n<WaitlistPublicNamespace, WaitlistPublicKeys>(
    waitlistPublicNamespace,
  );

  const {
    flow,
    fields,
    selectedAppointmentOption,
    selectedMember,
    dateTime,
    isOnlyWaitlist,
    waitlistTimes,
    handleNewBooking,
    price,
    discount,
    discountAmount,
    basePrice,
    duration,
  } = useScheduleContext();

  const locale = useLocale();
  const formatter = useFormatter();
  const defaultTimeZone = useTimeZone();

  if (!selectedAppointmentOption) return null;

  const groups = groupWaitlistDates(waitlistTimes.dates || []);

  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-6 h-6 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        {flow === "waitlist"
          ? t("block.confirmation.waitlist.title")
          : i18n("booking.confirmation.successTitle")}
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        {flow === "waitlist"
          ? t("block.confirmation.waitlist.message", {
              name: fields.name,
              service: selectedAppointmentOption.name,
            })
          : i18n("booking.confirmation.successMessage", {
              name: fields.name,
              service: selectedAppointmentOption.name,
            })}
      </p>
      <div className="bg-muted/50 flex flex-col gap-2 rounded-lg p-4 text-left">
        <p className="text-sm text-muted-foreground">
          {flow === "waitlist"
            ? t("block.confirmation.waitlist.waitlist_details")
            : i18n("booking.confirmation.appointmentDetails")}
        </p>
        <p className="text-sm font-semibold text-foreground">
          {selectedAppointmentOption.name}
        </p>
        {selectedMember && (
          <div className="flex items-center gap-2 confirmation-specialist">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage
                src={selectedMember.member.image ?? undefined}
                alt={selectedMember.member.name}
              />
              <AvatarFallback>
                {selectedMember.member.name?.charAt(0)?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs text-foreground">
              {i18n("booking.confirmation.specialist", {
                name: selectedMember.member.name,
              })}
            </p>
          </div>
        )}
        {flow === "booking" && dateTime && (
          <>
            <p className="text-xs text-foreground">
              {DateTime.fromJSDate(dateTime.date)
                .set({ hour: dateTime.time.hour, minute: dateTime.time.minute })
                .setZone(dateTime.timeZone)
                .toLocaleString(DateTime.DATETIME_HUGE, { locale })}
            </p>
          </>
        )}
        {flow === "waitlist" ? (
          waitlistTimes.asSoonAsPossible ? (
            <p className="text-xs text-foreground">
              {t("block.asSoonAsPossible.label")}
            </p>
          ) : (
            <div className="text-sm text-foreground">
              {groups.map((group) => (
                <div className="mb-2 flex items-center gap-2 text-foreground text-xs confirmation-date-content">
                  <div className="review-date-date">
                    <p className="font-medium text-xs truncate">
                      {formatDateRange(group.startDate, group.endDate, locale)}
                      {group.dates.length > 1 && (
                        <span className="text-muted-foreground ml-1">
                          {t("block.dates.groupLabel", {
                            count: group.dates.length,
                          })}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatter.list(
                        group.times.map((time) => (
                          <span key={time}>{t(`block.times.${time}`)}</span>
                        )),
                        { type: "conjunction" },
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}
        <p className="text-xs text-muted-foreground mt-1">
          {i18n("booking.confirmation.duration", {
            duration: i18n(
              "common.formats.durationHourMinutes",
              durationToTime(duration || 0),
            ),
          })}
        </p>
        {!!discount && (
          <>
            <p className="text-xs text-muted-foreground mt-1">
              {i18n("booking.confirmation.price.original", {
                original: currencyFormat(basePrice),
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {i18n("booking.confirmation.price.discount", {
                discount: currencyFormat(discountAmount),
              })}
            </p>
          </>
        )}
        {!!basePrice && (
          <p className="text-sm font-semibold text-foreground mt-1">
            {i18n("booking.confirmation.price.total", {
              total: currencyFormat(price),
            })}
          </p>
        )}
      </div>
      {!isOnlyWaitlist && (
        <div className="mt-6 confirm-new-booking-button-container">
          <Button
            onClick={handleNewBooking}
            variant="outline"
            className="confirm-new-booking-button"
          >
            {i18n("booking.confirmation.newBookingButton")}
          </Button>
        </div>
      )}
    </div>
  );
};
