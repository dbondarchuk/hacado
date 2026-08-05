import { useFormatter, useI18n, useLocale } from "@hacado/i18n/client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Markdown,
  useCurrencyFormat,
} from "@hacado/ui";
import { durationToTime } from "@hacado/utils";
import { Calendar, Clock } from "lucide-react";
import { formatDateRange, groupWaitlistDates } from "../../../../models/utils";
import {
  WaitlistPublicKeys,
  waitlistPublicNamespace,
  WaitlistPublicNamespace,
} from "../../../../translations/types";
import { useScheduleContext } from "./context";

export const WaitlistReviewCard: React.FC = () => {
  const {
    selectedAppointmentOption,
    selectedAddons,
    selectedMember,
    fields,
    price,
    flow,
    waitlistTimes,
    duration,
  } = useScheduleContext();

  const locale = useLocale();
  const formatter = useFormatter();

  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();
  const t = useI18n<WaitlistPublicNamespace, WaitlistPublicKeys>(
    waitlistPublicNamespace,
  );

  if (!selectedAppointmentOption || flow !== "waitlist") return null;

  const { name, email, phone } = fields;
  const groups = groupWaitlistDates(waitlistTimes.dates || []);
  const servicePrice =
    selectedAppointmentOption.durationType === "fixed"
      ? (selectedMember?.effectivePrice ?? selectedAppointmentOption.price)
      : (selectedMember?.effectivePrice ??
        selectedAppointmentOption.pricePerHour);
  const serviceDuration =
    selectedAppointmentOption.durationType === "fixed"
      ? (selectedMember?.effectiveDuration ??
        selectedAppointmentOption.duration)
      : undefined;
  return (
    <div className="space-y-6 review-card card-container">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground review-card-title card-title">
          {t("block.review.waitlistTitle")}
        </h2>
        <p className="text-xs text-muted-foreground review-card-description card-description">
          {i18n("booking.review.description")}
        </p>
      </div>

      {/* Service Summary */}
      <div className="border rounded-lg p-4 space-y-4 review-service-summary">
        <div className="flex items-start justify-between review-service-summary-content">
          <div>
            <h3 className="text-sm font-semibold text-foreground review-service-summary-title">
              {selectedAppointmentOption.name}
            </h3>
            <Markdown
              markdown={selectedAppointmentOption.description}
              prose="simple"
              className="text-xs text-muted-foreground [&_p]:my-0.5 [&_p]:leading-6 review-service-summary-description"
            />
          </div>
          {selectedAppointmentOption.durationType === "fixed" &&
            (!!servicePrice || !!serviceDuration) && (
              <div className="text-right shrink-0 review-service-summary-price">
                {!!servicePrice && (
                  <p className="text-xs font-semibold text-foreground review-service-summary-price-amount">
                    {currencyFormat(servicePrice)}
                  </p>
                )}
                {!!serviceDuration && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end review-service-summary-price-duration">
                    <Clock className="w-3 h-3" />{" "}
                    {i18n(
                      "common.formats.durationHourMin",
                      durationToTime(serviceDuration),
                    )}
                  </p>
                )}
              </div>
            )}
          {selectedAppointmentOption.durationType === "flexible" &&
            !!servicePrice && (
              <div className="text-right shrink-0 review-service-summary-price">
                <p className="text-xs font-semibold text-foreground review-service-summary-price-amount">
                  {i18n("booking.option.price_per_hour", {
                    price: currencyFormat(servicePrice),
                  })}
                </p>
              </div>
            )}
        </div>

        {selectedMember && (
          <div className="border-t pt-4 review-specialist">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 review-specialist-title">
              {i18n("booking.review.specialist.title")}
            </h4>
            <div className="flex items-center gap-3 review-specialist-content">
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage
                  src={selectedMember.member.image ?? undefined}
                  alt={selectedMember.member.name}
                />
                <AvatarFallback>
                  {selectedMember.member.name?.charAt(0)?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground review-specialist-name">
                {selectedMember.member.name}
              </span>
            </div>
          </div>
        )}

        {/* Add-ons */}
        {selectedAddons.length > 0 && (
          <div className="border-t pt-4 review-addons">
            <h4 className="text-sm font-medium text-muted-foreground mb-2 review-addons-title">
              {i18n("booking.review.addons.title")}
            </h4>
            {selectedAddons.map((addon) => (
              <div
                key={addon._id}
                className="flex items-center justify-between py-1 review-addons-item"
              >
                <span className="text-xs text-foreground review-addons-name">
                  {addon.name}
                </span>
                {(!!addon.price || !!addon.duration) && (
                  <div className="text-right shrink-0 review-addons-price">
                    {!!addon.price && (
                      <span className="text-xs font-medium text-foreground">
                        +{currencyFormat(addon.price || 0)}
                      </span>
                    )}
                    {!!addon.duration && (
                      <span className="text-xs text-muted-foreground ml-2 review-addons-duration">
                        +
                        {i18n(
                          "common.formats.durationHourMin",
                          durationToTime(addon.duration),
                        )}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Date & Time */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-2 review-date-title">
            {i18n("booking.review.date.title")}
          </h4>
          {waitlistTimes.asSoonAsPossible ? (
            <div className="mb-2 flex items-center gap-2 text-foreground text-xs review-date-content">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="review-date-date">
                {t("block.asSoonAsPossible.label")}
              </span>
            </div>
          ) : (
            <>
              {groups.map((group) => (
                <div className="mb-2 flex items-center gap-2 text-foreground text-xs review-date-content">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
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
            </>
          )}
          <div className="flex items-center gap-2 text-foreground text-xs review-duration-content">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="review-date-duration">
              {i18n("booking.review.date.duration", {
                duration: i18n(
                  "common.formats.durationHourMin",
                  durationToTime(duration || 0),
                ),
              })}
            </span>
          </div>
        </div>

        {/* Contact Details */}
        <div className="border-t pt-4 review-contact-details">
          <h4 className="text-sm font-medium text-muted-foreground mb-2 review-contact-details-title">
            {i18n("booking.review.contact.title")}
          </h4>
          <div className="space-y-1 text-xs">
            <p className="text-foreground review-contact-details-name">
              <span className="font-medium">
                {i18n("booking.review.contact.name", { name })}
              </span>
            </p>
            <p className="text-muted-foreground review-contact-details-email">
              {i18n("booking.review.contact.email", { email })}
            </p>
            {phone && (
              <p className="text-muted-foreground review-contact-details-phone">
                {i18n("booking.review.contact.phone", { phone })}
              </p>
            )}
          </div>
        </div>

        {/* Total */}
        {!!price && price > 0 && (
          <div className="border-t pt-4 review-total">
            <div className="flex items-center justify-between review-total-content">
              <div>
                {!!price && price > 0 && (
                  <p className="font-semibold text-foreground review-total-title">
                    {i18n("booking.review.price.total")}
                  </p>
                )}
              </div>
              {!!price && price > 0 && (
                <p className="text-lg font-bold text-foreground review-total-amount">
                  {currencyFormat(price)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
