import { useI18n } from "@hacado/i18n/client";
import { PublicStaffMember } from "@hacado/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Markdown,
  useCurrencyFormat,
} from "@hacado/ui";
import { durationToTime } from "@hacado/utils";
import { Clock } from "lucide-react";
import React from "react";
import { useScheduleContext } from "./context";

export type SpecialistListOption = {
  member: PublicStaffMember;
  effectivePrice?: number;
  effectiveDuration?: number;
};

export type SpecialistListProps = {
  staff: SpecialistListOption[];
  selectedMemberId?: string | null;
  onSelect: (memberId: string) => void;
  /** When flexible, price overrides are hourly rates. */
  durationType?: "fixed" | "flexible";
  className?: string;
};

/** Presentational staff picker, reused both inside and outside the booking schedule. */
export const SpecialistList: React.FC<SpecialistListProps> = ({
  staff,
  selectedMemberId,
  onSelect,
  durationType = "fixed",
  className,
}) => {
  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();

  return (
    <div className={cn("grid gap-3", className)}>
      {staff.map(({ member, effectivePrice, effectiveDuration }) => {
        const isSelected = selectedMemberId === member.id;

        return (
          <Card
            key={member.id}
            onClick={() => onSelect(member.id)}
            className={cn(
              "cursor-pointer flex flex-row items-center gap-4 p-4",
              isSelected ? "border-primary bg-primary/5" : "",
            )}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onSelect(member.id);
                e.preventDefault();
              }
            }}
          >
            <Avatar className="w-12 h-12">
              <AvatarImage src={member.image ?? undefined} alt={member.name} />
              <AvatarFallback>
                {member.name?.charAt(0)?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <CardHeader className="p-0 flex-1">
              <CardTitle className="mt-0 text-base">{member.name}</CardTitle>
              {member.bio && (
                <CardContent className="p-0">
                  <Markdown
                    markdown={member.bio}
                    prose="simple"
                    className="text-xs text-muted-foreground [&_p]:my-0.5"
                  />
                </CardContent>
              )}
            </CardHeader>
            {(effectivePrice != null ||
              (durationType === "fixed" && effectiveDuration != null)) && (
              <div className="text-right flex-shrink-0">
                {effectivePrice != null && (
                  <p className="text-sm font-semibold text-foreground">
                    {durationType === "flexible"
                      ? i18n("booking.option.price_per_hour", {
                          price: currencyFormat(effectivePrice),
                        })
                      : currencyFormat(effectivePrice)}
                  </p>
                )}
                {durationType === "fixed" && effectiveDuration != null && (
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
          </Card>
        );
      })}
    </div>
  );
};

/** In-schedule "specialist" step: choose the staff member for the already-selected service. */
export const SpecialistCard: React.FC = () => {
  const i18n = useI18n("translation");
  const {
    activeStaff,
    selectedMemberId,
    setSelectedMemberId,
    appointmentOption,
  } = useScheduleContext();

  return (
    <div className="flex flex-col gap-2">
      <div className="text-center">
        <h2 className="text-xl">{i18n("booking.specialist.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {i18n("booking.specialist.choose")}
        </p>
      </div>
      <SpecialistList
        staff={activeStaff}
        selectedMemberId={selectedMemberId}
        onSelect={setSelectedMemberId}
        durationType={appointmentOption.durationType}
      />
    </div>
  );
};
