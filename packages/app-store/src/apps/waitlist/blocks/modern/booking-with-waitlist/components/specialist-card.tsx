import { useI18n } from "@timelish/i18n/client";
import { PublicStaffMember } from "@timelish/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  cn,
  Markdown,
  useCurrencyFormat,
} from "@timelish/ui";
import { durationToTime } from "@timelish/utils";
import { Clock } from "lucide-react";
import React from "react";
import { useScheduleContext } from "./context";

export const SpecialistCard: React.FC = () => {
  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();
  const {
    selectedAppointmentOption,
    activeStaff,
    staffAcrossOptions,
    selectedMemberId,
    setSelectedMemberId,
  } = useScheduleContext();

  const candidates: {
    member: PublicStaffMember;
    effectivePrice?: number;
    effectiveDuration?: number;
  }[] = selectedAppointmentOption
    ? activeStaff
    : staffAcrossOptions.map((member) => ({ member }));

  return (
    <div className="space-y-4 specialist-card card-container">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground specialist-card-title card-title">
          {i18n("booking.specialist.title")}
        </h2>
        <p className="text-xs text-muted-foreground specialist-card-description card-description">
          {i18n("booking.specialist.choose")}
        </p>
      </div>
      <div className="grid gap-3 specialist-list">
        {candidates.map(({ member, effectivePrice, effectiveDuration }) => {
          const isSelected = selectedMemberId === member.id;

          return (
            <button
              key={member.id}
              onClick={() => setSelectedMemberId(member.id)}
              className={cn(
                "w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-4 text-left cursor-pointer",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-accent/50",
              )}
            >
              <Avatar className="w-12 h-12 flex-shrink-0">
                <AvatarImage
                  src={member.image ?? undefined}
                  alt={member.name}
                />
                <AvatarFallback>
                  {member.name?.charAt(0)?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground">
                  {member.name}
                </h3>
                {member.bio && (
                  <Markdown
                    markdown={member.bio}
                    prose="simple"
                    className="text-xs text-muted-foreground [&_p]:my-0.5 [&_p]:leading-6"
                  />
                )}
              </div>
              {(effectivePrice != null ||
                (selectedAppointmentOption?.durationType === "fixed" &&
                  effectiveDuration != null)) && (
                <div className="text-right flex-shrink-0">
                  {effectivePrice != null && (
                    <p className="text-sm font-semibold text-foreground">
                      {selectedAppointmentOption?.durationType === "flexible"
                        ? i18n("booking.option.price_per_hour", {
                            price: currencyFormat(effectivePrice),
                          })
                        : currencyFormat(effectivePrice)}
                    </p>
                  )}
                  {selectedAppointmentOption?.durationType === "fixed" &&
                    effectiveDuration != null && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {i18n(
                          "common.formats.durationHourMin",
                          durationToTime(effectiveDuration),
                        )}
                      </p>
                    )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
