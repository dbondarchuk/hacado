import { useI18n } from "@hacado/i18n/client";
import {
  AppointmentChoice,
  AppointmentPackage,
  BookingCatalogNode,
  minEffectiveDuration,
  minEffectivePrice,
  PublicStaffMember,
  summarizePackageItems,
} from "@hacado/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Markdown,
  useCurrencyFormat,
} from "@hacado/ui";
import { durationToTime } from "@hacado/utils";
import { DollarSign, Timer } from "lucide-react";
import React from "react";

const activateOnKey = (event: React.KeyboardEvent, action: () => void) => {
  if (event.key === "Enter" || event.key === " ") {
    action();
    event.preventDefault();
  }
};

export type AppointmentChoiceCardProps = {
  option: AppointmentChoice;
  members?: PublicStaffMember[];
  isBookingRestricted?: boolean;
  onSelect: (id: string) => void;
};

export const AppointmentChoiceCard: React.FC<AppointmentChoiceCardProps> = ({
  option,
  members = [],
  isBookingRestricted,
  onSelect,
}) => {
  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();
  const activeMemberIds = React.useMemo(
    () => new Set(members.map((m) => m.id)),
    [members],
  );
  const activeAssignments = (option.staff || []).filter((s) =>
    activeMemberIds.has(s.memberId),
  );
  const isFromPricing = activeAssignments.length > 1;
  const displayDuration =
    option.durationType === "fixed"
      ? minEffectiveDuration(option.duration, activeAssignments)
      : undefined;
  const displayPrice =
    option.durationType === "fixed"
      ? minEffectivePrice(option.price, activeAssignments)
      : minEffectivePrice(option.pricePerHour, activeAssignments);

  const select = () => {
    if (!isBookingRestricted) onSelect(option._id);
  };

  return (
    <Card
      onClick={select}
      onKeyDown={(e) => activateOnKey(e, select)}
      className={cn(
        "flex flex-col justify-between",
        isBookingRestricted
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer",
      )}
      tabIndex={isBookingRestricted ? -1 : 0}
      aria-describedby={`option-${option._id}`}
      role="button"
    >
      <CardHeader id={`option-${option._id}`}>
        <div className="flex flex-col grow gap-2">
          <CardTitle>{option.name}</CardTitle>
          <CardDescription className="flex flex-col gap-2">
            <div
              className="flex flex-row items-center"
              aria-label={
                option.durationType === "fixed"
                  ? i18n(
                      "common.formats.formDurationHourMinutesLabel",
                      durationToTime(option.duration),
                    )
                  : i18n("common.formats.customDurationLabel")
              }
            >
              <Timer className="mr-1" />
              {option.durationType === "fixed"
                ? isFromPricing
                  ? i18n("booking.specialist.fromDuration", {
                      duration: i18n(
                        "common.formats.durationHourMin",
                        durationToTime(displayDuration ?? option.duration),
                      ),
                    })
                  : i18n(
                      "common.formats.durationHourMin",
                      durationToTime(displayDuration ?? option.duration),
                    )
                : i18n("common.labels.durationCustom")}
            </div>
            {option.durationType === "fixed" && !!displayPrice && (
              <div
                className="flex flex-row items-center"
                aria-label={i18n("common.formats.formPriceLabel", {
                  price: currencyFormat(displayPrice),
                })}
              >
                <DollarSign className="mr-1" aria-label="" />
                {isFromPricing
                  ? i18n("booking.specialist.fromPrice", {
                      price: currencyFormat(displayPrice),
                    })
                  : currencyFormat(displayPrice)}
              </div>
            )}
            {option.durationType === "flexible" && !!displayPrice && (
              <div
                className="flex flex-row items-center"
                aria-label={i18n("common.formats.formPriceLabel", {
                  price: currencyFormat(displayPrice),
                })}
              >
                <DollarSign className="mr-1" aria-label="" />
                {isFromPricing
                  ? i18n("booking.specialist.fromPrice", {
                      price: i18n("booking.option.price_per_hour", {
                        price: currencyFormat(displayPrice),
                      }),
                    })
                  : i18n("booking.option.price_per_hour", {
                      price: currencyFormat(displayPrice),
                    })}
              </div>
            )}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Markdown markdown={option.description} prose="simple" />
      </CardContent>
    </Card>
  );
};

type CatalogItemCardProps = {
  id: string;
  title: string;
  description?: string;
  badge?: string;
  meta?: React.ReactNode;
  included?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  onSelect: () => void;
};

const CatalogItemCard: React.FC<CatalogItemCardProps> = ({
  id,
  title,
  description,
  badge,
  meta,
  included,
  disabled,
  className,
  onSelect,
}) => (
  <Card
    onClick={() => {
      if (!disabled) onSelect();
    }}
    onKeyDown={(e) => {
      if (!disabled) activateOnKey(e, onSelect);
    }}
    className={cn(
      "flex flex-col justify-between",
      disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      className,
    )}
    tabIndex={disabled ? -1 : 0}
    aria-describedby={`catalog-${id}`}
    role="button"
  >
    <CardHeader id={`catalog-${id}`}>
      <div className="flex flex-col grow gap-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className={badge ? "package-card-title" : undefined}>
            {title}
          </CardTitle>
          {badge ? (
            <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground package-card-badge">
              {badge}
            </span>
          ) : null}
        </div>
        {meta ? (
          <CardDescription className="flex flex-col gap-2">
            {meta}
          </CardDescription>
        ) : null}
      </div>
    </CardHeader>
    <CardContent>
      <Markdown markdown={description ?? ""} prose="simple" />
      {included}
    </CardContent>
  </Card>
);

export type CatalogCardsProps = {
  nodes: BookingCatalogNode[];
  options: AppointmentChoice[];
  allOptions?: AppointmentChoice[];
  packages?: AppointmentPackage[];
  members?: PublicStaffMember[];
  isBookingRestricted?: boolean;
  className?: string;
  onSelectGroup: (id: string) => void;
  onSelectOption: (id: string) => void;
  onSelectPackage: (pkg: AppointmentPackage) => void;
};

export const CatalogCards: React.FC<CatalogCardsProps> = ({
  nodes,
  options,
  allOptions,
  packages,
  members,
  isBookingRestricted,
  className,
  onSelectGroup,
  onSelectOption,
  onSelectPackage,
}) => {
  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();

  const cards = nodes.flatMap((node) => {
    if (node.type === "group") {
      return [
        <CatalogItemCard
          key={node.id}
          id={node.id}
          title={node.name}
          description={node.description}
          className="catalog-group-card"
          onSelect={() => onSelectGroup(node.id)}
        />,
      ];
    }
    if (node.type === "package") {
      const pkg = packages?.find((item) => item._id === node.packageId);
      if (!pkg) return [];
      const included = summarizePackageItems(pkg.items, allOptions ?? options);
      return [
        <CatalogItemCard
          key={node.id}
          id={node.id}
          title={pkg.name}
          description={pkg.description}
          badge={i18n("booking.catalog.package")}
          className="package-card"
          disabled={isBookingRestricted}
          included={
            included.length ? (
              <div className="mt-2 space-y-1 package-card-included">
                <p className="text-xs font-medium text-muted-foreground package-card-included-title">
                  {i18n("booking.package.included")}
                </p>
                <ul className="space-y-0.5 text-sm text-muted-foreground package-card-included-list">
                  {included.map((item) => (
                    <li
                      key={item.optionId}
                      className="flex items-center justify-between gap-2 package-card-included-item"
                    >
                      <span className="package-card-included-item-name">
                        {i18n("booking.package.includedItem", {
                          name: item.name,
                          count: item.credits,
                        })}
                      </span>
                      {item.duration ? (
                        <span className="shrink-0 flex items-center gap-1 package-card-included-item-duration">
                          <Timer className="w-3 h-3" />
                          {i18n(
                            "common.formats.durationHourMin",
                            durationToTime(item.duration),
                          )}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          }
          meta={
            pkg.price ? (
              <div
                className="flex flex-row items-center package-card-price"
                aria-label={i18n("common.formats.formPriceLabel", {
                  price: currencyFormat(pkg.price),
                })}
              >
                <DollarSign className="mr-1" aria-label="" />
                {currencyFormat(pkg.price)}
              </div>
            ) : null
          }
          onSelect={() => onSelectPackage(pkg)}
        />,
      ];
    }
    const choice = options.find((item) => item._id === node.optionId);
    if (!choice) return [];
    return [
      <AppointmentChoiceCard
        key={node.id}
        option={choice}
        members={members}
        isBookingRestricted={isBookingRestricted}
        onSelect={onSelectOption}
      />,
    ];
  });

  if (!cards.length) {
    return (
      <p className="text-sm text-muted-foreground text-center">
        {i18n("booking.catalog.empty")}
      </p>
    );
  }

  return <div className={className}>{cards}</div>;
};

export type AppointmentsCardProps = {
  options: AppointmentChoice[];
  members?: PublicStaffMember[];
  className?: string;
  id?: string;
  isBookingRestricted?: boolean;
  onSelectOption: (slug: string) => void;
};

export const AppointmentsCard: React.FC<
  AppointmentsCardProps & React.HTMLAttributes<HTMLDivElement>
> = ({
  options: meetings,
  members = [],
  className,
  id,
  isBookingRestricted,
  onSelectOption,
  ...props
}) => {
  return (
    <div className={className} id={id} {...props}>
      {meetings.map((option) => (
        <AppointmentChoiceCard
          key={option._id}
          option={option}
          members={members}
          isBookingRestricted={isBookingRestricted}
          onSelect={onSelectOption}
        />
      ))}
    </div>
  );
};
