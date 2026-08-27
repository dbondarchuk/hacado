import { clientApi, ClientApiError } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import {
  AppointmentChoice,
  catalogNodesAtPath,
  creditsPerRedemptionForItem,
  CustomerPackage,
  effectiveStaffDuration,
  effectiveStaffPrice,
  filterCatalogNodes,
  getActiveStaffForAssignments,
  minEffectiveDuration,
  minEffectivePrice,
  summarizePackageItems,
} from "@hacado/types";
import { Button, cn, Markdown, Skeleton, useCurrencyFormat } from "@hacado/ui";
import { durationToTime } from "@hacado/utils";
import { Clock, Minus, Plus } from "lucide-react";
import React from "react";
import { useScheduleContext } from "./context";

export const AppointmentOptionCard: React.FC = () => {
  const {
    appointmentOptions,
    selectedAppointmentOption,
    setSelectedAppointmentOption,
    areAppointmentOptionsLoading,
    setDiscount,
    setDateTime,
    baseDuration,
    setDuration,
    setSelectedAddons,
    members,
    flowOrder,
    flow,
    isOnlyWaitlist,
    selectedMemberId,
    setSelectedMemberId,
    catalog,
    catalogPath,
    setCatalogPath,
    packages,
    purchasePackageId,
    setPurchasePackageId,
    setCustomerPackageId,
    packageBookingFlow,
    setPackageBookingFlow,
    hasActiveCustomerPackages,
    otpVerified,
    setOtpVerified,
    setOtpReturnStep,
    setOtpDialogOpen,
    setCurrentStep,
    fetchAvailability,
    setIsLoading,
    refreshBookingOptions,
    setFields,
    fields,
    setFlow,
  } = useScheduleContext();

  const i18n = useI18n("translation");
  const currencyFormat = useCurrencyFormat();
  const [myPackages, setMyPackages] = React.useState<CustomerPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = React.useState(false);
  const [packagesError, setPackagesError] = React.useState(false);

  const activeMemberIds = React.useMemo(
    () => new Set(members.map((m) => m.id)),
    [members],
  );

  const visibleOptions =
    flowOrder === "specialist-first" && selectedMemberId
      ? appointmentOptions.filter(
          (o) =>
            !!o.staff?.length &&
            o.staff.some((s) => s.memberId === selectedMemberId),
        )
      : appointmentOptions;

  const excludePackages = isOnlyWaitlist || flow === "waitlist";
  const filteredCatalog = React.useMemo(
    () =>
      filterCatalogNodes(catalog, {
        excludePackages,
        optionIds: visibleOptions.map((option) => option._id),
        packageIds: excludePackages
          ? undefined
          : packages?.map((pkg) => pkg._id),
      }),
    [catalog, excludePackages, visibleOptions, packages],
  );
  const { nodes: currentCatalogNodes, group: currentCatalogGroup } =
    React.useMemo(
      () => catalogNodesAtPath(filteredCatalog, catalogPath),
      [filteredCatalog, catalogPath],
    );

  const onClick = (option: AppointmentChoice): void => {
    setSelectedAppointmentOption(option);
    setSelectedAddons([]);
    setDiscount(undefined);
    setDateTime(undefined);
    if (flowOrder !== "specialist-first") {
      setSelectedMemberId(null);
    }
  };

  const renderServiceOption = (
    option: AppointmentChoice,
    {
      key,
      isSelected,
      onSelect,
    }: { key: string; isSelected: boolean; onSelect: () => void },
  ) => {
    const baseOptionDuration =
      option.durationType === "fixed" ? option.duration : null;
    const baseOptionPrice =
      option.durationType === "fixed" ? option.price : option.pricePerHour;

    const memberAssignment = selectedMemberId
      ? option.staff?.find((s) => s.memberId === selectedMemberId)
      : undefined;
    const activeAssignments = (option.staff || []).filter((s) =>
      activeMemberIds.has(s.memberId),
    );
    const isFromPricing = !selectedMemberId && activeAssignments.length > 1;

    const currentDuration = selectedMemberId
      ? (effectiveStaffDuration(baseOptionDuration, memberAssignment) ??
        baseOptionDuration)
      : minEffectiveDuration(baseOptionDuration, activeAssignments);
    const currentPrice = selectedMemberId
      ? (effectiveStaffPrice(baseOptionPrice, memberAssignment) ??
        baseOptionPrice)
      : minEffectivePrice(baseOptionPrice, activeAssignments);

    return (
      <div
        key={key}
        className={cn(
          "w-full p-4 rounded-lg border-2 transition-all duration-200",
          isSelected
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-accent/50",
        )}
      >
        <button onClick={onSelect} className="w-full text-left cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                {option.name}
              </h3>
              <Markdown
                markdown={option.description}
                prose="simple"
                className="text-xs text-muted-foreground [&_p]:my-0.5 [&_p]:leading-6"
              />
            </div>
            {(!!currentPrice || !!currentDuration) && (
              <div className="text-right flex-shrink-0">
                {!!currentPrice &&
                  (() => {
                    const priceLabel =
                      option.durationType === "fixed"
                        ? currencyFormat(currentPrice)
                        : i18n("booking.option.price_per_hour", {
                            price: currencyFormat(currentPrice),
                          });

                    return (
                      <p className="text-sm font-semibold text-foreground option-card-price">
                        {isFromPricing
                          ? i18n("booking.specialist.fromPrice", {
                              price: priceLabel,
                            })
                          : priceLabel}
                      </p>
                    );
                  })()}
                {!!currentDuration && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3" />{" "}
                    {isFromPricing
                      ? i18n("booking.specialist.fromDuration", {
                          duration: i18n(
                            "common.formats.durationHourMin",
                            durationToTime(currentDuration),
                          ),
                        })
                      : i18n(
                          "common.formats.durationHourMin",
                          durationToTime(currentDuration),
                        )}
                  </p>
                )}
              </div>
            )}
          </div>
        </button>
        {option.durationType === "flexible" && isSelected && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-row gap-2 items-center justify-between">
              <div className="flex flex-col gap-2">
                <div className="text-xs font-medium text-foreground">
                  {i18n("booking.option.duration.custom.title")}
                </div>
                <p className="hidden sm:block text-xs text-muted-foreground">
                  {i18n("booking.option.duration.custom.min_max", {
                    min: i18n(
                      "common.formats.durationHourMin",
                      durationToTime(option.durationMin),
                    ),
                    max: i18n(
                      "common.formats.durationHourMin",
                      durationToTime(option.durationMax),
                    ),
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDuration(
                      baseDuration ? baseDuration - option.durationStep : 0,
                    );
                  }}
                  disabled={
                    baseDuration
                      ? baseDuration - option.durationStep <= 0
                      : false
                  }
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border transition-colors",
                    !baseDuration || baseDuration <= option.durationStep
                      ? "border-muted text-muted-foreground cursor-not-allowed"
                      : "border-primary text-primary hover:bg-primary hover:text-primary-foreground",
                  )}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-28 text-center font-semibold text-foreground">
                  {i18n(
                    "common.formats.durationHourMin",
                    durationToTime(baseDuration || 0),
                  )}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDuration(
                      baseDuration
                        ? baseDuration + option.durationStep
                        : option.durationStep,
                    );
                  }}
                  disabled={
                    baseDuration ? baseDuration >= option.durationMax : false
                  }
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border transition-colors",
                    baseDuration && baseDuration >= option.durationMax
                      ? "border-muted text-muted-foreground cursor-not-allowed"
                      : "border-primary text-primary hover:bg-primary hover:text-primary-foreground",
                  )}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const startPackageBooking = async () => {
    setFlow("booking");
    setPackageBookingFlow(true);
    setPurchasePackageId(undefined);
    setCustomerPackageId(undefined);
    setSelectedAppointmentOption(undefined);
    setSelectedAddons([]);
    try {
      const session = await clientApi.customerAuth.checkSession();
      if (session?.success) {
        setOtpVerified(true);
        setFields({
          ...fields,
          name: session.name || fields.name,
          email: session.email || fields.email,
          phone: session.phone || fields.phone,
        });
        await refreshBookingOptions?.();
        return;
      }
    } catch {
      // fall through to OTP
    }
    setOtpReturnStep("packages");
    setOtpDialogOpen(true);
  };

  React.useEffect(() => {
    if (!packageBookingFlow || !otpVerified) {
      setMyPackages([]);
      setPackagesError(false);
      return;
    }
    let cancelled = false;
    setPackagesLoading(true);
    setPackagesError(false);
    clientApi.customerAuth
      .getMyPackages()
      .then((response) => {
        if (cancelled) return;
        setMyPackages(
          (response.items ?? []).filter((pkg) => pkg.remainingCredits > 0),
        );
      })
      .catch((error) => {
        if (cancelled) return;
        setMyPackages([]);
        setPackagesError(
          !(error instanceof ClientApiError && error.status === 403),
        );
      })
      .finally(() => {
        if (!cancelled) setPackagesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [packageBookingFlow, otpVerified]);

  const selectCustomerPackage = async (pkg: CustomerPackage) => {
    const redeemableItem = pkg.items.find((item) => {
      const remaining = pkg.remainingByItem[item._id] ?? 0;
      const needed = creditsPerRedemptionForItem(item);
      return (
        remaining >= needed &&
        appointmentOptions.some((option) => option._id === item.optionId)
      );
    });
    const option = redeemableItem
      ? appointmentOptions.find((item) => item._id === redeemableItem.optionId)
      : undefined;
    if (!option) {
      setPackagesError(true);
      return;
    }

    setFlow("booking");
    setCustomerPackageId(pkg._id);
    setPurchasePackageId(undefined);
    setSelectedAddons([]);
    setDiscount(undefined);
    setDateTime(undefined);
    setSelectedAppointmentOption(option);
    const nextDuration =
      option.durationType === "fixed" ? option.duration : option.durationMin;
    setDuration(nextDuration);

    const staff = getActiveStaffForAssignments(
      option.staff,
      members,
      option.durationType === "fixed" ? option.price : option.pricePerHour,
      option.durationType === "fixed" ? option.duration : undefined,
    );
    const memberId = staff.length === 1 ? staff[0].member.id : null;
    setSelectedMemberId(memberId);

    setIsLoading(true);
    setCurrentStep("calendar");
    clientApi.booking.trackAdvanceFromUiStep("option", {
      optionId: option._id,
      memberId: memberId ?? undefined,
      duration: nextDuration,
    });

    try {
      await fetchAvailability(memberId, nextDuration);
    } finally {
      setIsLoading(false);
    }
  };

  if (packageBookingFlow && otpVerified) {
    return (
      <div className="space-y-4 option-card card-container package-booking-card">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground option-card-title card-title">
            {i18n("booking.package.selectPackage")}
          </h2>
          <p className="text-xs text-muted-foreground option-card-description card-description">
            {i18n("booking.package.selectPackageDescription")}
          </p>
        </div>
        {packagesLoading ? (
          <div className="grid gap-3">
            <Skeleton className="w-full h-24 rounded-lg" />
            <Skeleton className="w-full h-24 rounded-lg" />
          </div>
        ) : packagesError ? (
          <p className="text-sm text-destructive">
            {i18n("booking.package.noPackages")}
          </p>
        ) : myPackages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {i18n("booking.package.noPackages")}
          </p>
        ) : (
          <div className="grid gap-3">
            {myPackages.map((pkg) => (
              <button
                key={pkg._id}
                type="button"
                className="w-full p-4 rounded-lg border-2 text-left border-border hover:border-primary/50 hover:bg-accent/50"
                onClick={() => void selectCustomerPackage(pkg)}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium">{pkg.name}</h3>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {i18n("booking.package.remaining", {
                      remaining: pkg.remainingCredits,
                    })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 option-card card-container">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground option-card-title card-title">
          {currentCatalogGroup?.name || i18n("booking.option.title")}
        </h2>
        {currentCatalogGroup?.description ? (
          <Markdown
            markdown={currentCatalogGroup.description}
            prose="simple"
            className="text-xs text-muted-foreground option-card-description card-description [&_p]:my-0.5 [&_p]:leading-6"
          />
        ) : currentCatalogGroup ? null : (
          <p className="text-xs text-muted-foreground option-card-description card-description">
            {i18n("booking.option.description")}
          </p>
        )}
      </div>

      {!isOnlyWaitlist && hasActiveCustomerPackages ? (
        <div className="rounded-lg border border-dashed p-4 space-y-2 package-booking-cta">
          <p className="text-sm font-medium">
            {i18n("booking.package.bookWithPackage")}
          </p>
          <p className="text-xs text-muted-foreground">
            {i18n("booking.package.bookWithPackageDescription")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void startPackageBooking()}
          >
            {i18n("booking.package.bookWithPackage")}
          </Button>
        </div>
      ) : null}

      <div className="grid gap-3 option-list">
        {areAppointmentOptionsLoading ? (
          <>
            <Skeleton className="w-full h-36 rounded-lg" />
            <Skeleton className="w-full h-36 rounded-lg" />
            <Skeleton className="w-full h-36 rounded-lg" />
          </>
        ) : filteredCatalog.length ? (
          <>
            {currentCatalogNodes.map((node) => {
              if (node.type === "group") {
                return (
                  <button
                    key={node.id}
                    type="button"
                    className="w-full p-4 rounded-lg border-2 text-left catalog-group-card"
                    onClick={() => setCatalogPath([...catalogPath, node.id])}
                  >
                    <h3 className="text-sm font-medium">{node.name}</h3>
                    {node.description ? (
                      <Markdown
                        markdown={node.description}
                        prose="simple"
                        className="text-xs text-muted-foreground [&_p]:my-0.5 [&_p]:leading-6"
                      />
                    ) : null}
                  </button>
                );
              }
              if (node.type === "package") {
                const pkg = packages?.find(
                  (item) => item._id === node.packageId,
                );
                if (!pkg) return null;
                const isSelected = purchasePackageId === pkg._id;
                const included = summarizePackageItems(
                  pkg.items,
                  appointmentOptions,
                );
                return (
                  <button
                    key={node.id}
                    type="button"
                    className={cn(
                      "w-full p-4 rounded-lg border-2 text-left package-card",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-accent/50",
                    )}
                    onClick={() => {
                      const option = appointmentOptions.find(
                        (item) => item._id === pkg.items[0]?.optionId,
                      );
                      if (!option) return;
                      setFlow("booking");
                      setPurchasePackageId(pkg._id);
                      onClick(option);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium package-card-title">
                        {pkg.name}
                      </h3>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground package-card-badge">
                          {i18n("booking.catalog.package")}
                        </span>
                        {!!pkg.price && (
                          <span className="text-sm font-semibold text-foreground package-card-price">
                            {currencyFormat(pkg.price)}
                          </span>
                        )}
                      </div>
                    </div>
                    {pkg.description ? (
                      <Markdown
                        markdown={pkg.description}
                        prose="simple"
                        className="text-xs text-muted-foreground [&_p]:my-0.5 [&_p]:leading-6 package-card-description"
                      />
                    ) : null}
                    {included.length ? (
                      <div className="mt-2 space-y-1 package-card-included">
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground package-card-included-title">
                          {i18n("booking.package.included")}
                        </p>
                        <ul className="space-y-0.5 text-xs text-muted-foreground package-card-included-list">
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
                                  <Clock className="w-3 h-3" />
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
                    ) : null}
                  </button>
                );
              }
              const option = visibleOptions.find(
                (item) => item._id === node.optionId,
              );
              if (!option) return null;
              return renderServiceOption(option, {
                key: node.id,
                isSelected:
                  selectedAppointmentOption?._id === option._id &&
                  !purchasePackageId,
                onSelect: () => {
                  setPurchasePackageId(undefined);
                  onClick(option);
                },
              });
            })}
          </>
        ) : (
          <>
            {visibleOptions.map((option) =>
              renderServiceOption(option, {
                key: option._id,
                isSelected: selectedAppointmentOption?._id === option._id,
                onSelect: () => onClick(option),
              }),
            )}
          </>
        )}
      </div>
    </div>
  );
};
