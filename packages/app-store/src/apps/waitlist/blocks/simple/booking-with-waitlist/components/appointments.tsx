"use client";
import { clientApi, ClientApiError } from "@hacado/api-sdk";
import { useI18n } from "@hacado/i18n/client";
import {
  AppointmentChoice,
  AppointmentFields,
  AppointmentPackage,
  BookingCatalogNode,
  BookingRestriction,
  catalogNodesAtPath,
  catalogPathForOption,
  creditsPerRedemptionForItem,
  CustomerPackage,
  FieldSchema,
  filterCatalogNodes,
  getActiveStaffAcrossAssignments,
  isBookingLimitRestriction,
  PublicStaffMember,
} from "@hacado/types";
import { Button, cn, Markdown, Skeleton } from "@hacado/ui";
import { useSearchParams } from "next/navigation";
import React from "react";
import { BookingOtpDialog } from "../../../../components/booking-otp-dialog";
import { BookingRestrictionBanner } from "../../../../components/booking-restriction-banner";
import type { WaitlistOfferPrefill } from "../../../../models/waitlist-offer";
import { fetchWaitlistOffer } from "../../../fetch-waitlist-offer";
import { AppointmentsCard, CatalogCards } from "./appointments-card";
import { FlowOrder } from "./context";
import { Schedule } from "./schedule";
import { SpecialistList } from "./specialist-card";

export type AppointmentsProps = {
  options: AppointmentChoice[];
  members?: PublicStaffMember[];
  flowOrder?: FlowOrder;
  optionsClassName?: string;
  successPage?: string;
  fieldsSchema: Record<string, FieldSchema>;
  showPromoCode?: boolean;
  bookingRestriction?: BookingRestriction;
  catalog?: BookingCatalogNode[];
  packages?: AppointmentPackage[];
  className?: string;
  id?: string;
  isEditor?: boolean;
  appId?: string;
  isOnlyWaitlist: boolean;
  requireCustomerOtp?: boolean;
  hasActiveCustomerPackages?: boolean;
  refreshBookingOptions?: () => Promise<void>;
};

export const Appointments: React.FC<
  AppointmentsProps & React.HTMLAttributes<HTMLDivElement>
> = ({
  options,
  members = [],
  flowOrder = "service-first",
  optionsClassName,
  successPage,
  fieldsSchema,
  showPromoCode,
  bookingRestriction,
  catalog,
  packages,
  className,
  id,
  isEditor,
  appId,
  isOnlyWaitlist,
  requireCustomerOtp,
  hasActiveCustomerPackages,
  refreshBookingOptions,
  ...props
}) => {
  const i18n = useI18n("translation");
  const searchParams = useSearchParams();
  const fromQuery = searchParams.get("option");
  const waitlistTokenParam = searchParams.get("w");
  const [option, setOption] = React.useState<string | null>(fromQuery);
  const [waitlistOffer, setWaitlistOffer] =
    React.useState<WaitlistOfferPrefill | null>(null);
  const [catalogPath, setCatalogPath] = React.useState<string[]>([]);
  const [purchasePackageId, setPurchasePackageId] = React.useState<string>();
  const [customerPackageId, setCustomerPackageId] = React.useState<string>();
  const [packageBookingFlow, setPackageBookingFlow] = React.useState(false);
  const [packageOtpOpen, setPackageOtpOpen] = React.useState(false);
  const [otpVerified, setOtpVerified] = React.useState(false);
  const [bookingFields, setBookingFields] = React.useState<AppointmentFields>({
    name: "",
    email: "",
    phone: "",
  });
  const [myPackages, setMyPackages] = React.useState<CustomerPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = React.useState(false);
  const [packagesError, setPackagesError] = React.useState(false);
  const packageOtpVerifiedRef = React.useRef(false);
  const selected = options.find((m) => m._id === option);
  const isCustomerPackageLocked =
    packageBookingFlow && !!customerPackageId && !!selected;
  const isBookingRestricted =
    !isOnlyWaitlist && isBookingLimitRestriction(bookingRestriction);

  const staffAcrossOptions = React.useMemo(
    () =>
      getActiveStaffAcrossAssignments(
        options.map((o) => o.staff),
        members,
      ),
    [options, members],
  );
  const isSpecialistFirst =
    flowOrder === "specialist-first" && staffAcrossOptions.length > 0;
  const [specialistFirstMemberId, setSpecialistFirstMemberId] = React.useState<
    string | null
  >(null);

  React.useEffect(() => {
    if (!waitlistTokenParam || isEditor || !appId) return;
    let cancelled = false;
    void fetchWaitlistOffer(appId, waitlistTokenParam).then((offer) => {
      if (cancelled || !offer) return;
      setWaitlistOffer(offer);
      setOption(offer.optionId);
      setBookingFields((current) => ({ ...current, ...offer.fields }));
      if (offer.memberId) {
        setSpecialistFirstMemberId(offer.memberId);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [waitlistTokenParam, isEditor, appId]);

  const availableOptions =
    isSpecialistFirst && specialistFirstMemberId
      ? options.filter(
          (o) =>
            !!o.staff?.length &&
            o.staff.some((s) => s.memberId === specialistFirstMemberId),
        )
      : options;

  const displayCatalog = React.useMemo(
    () =>
      filterCatalogNodes(catalog, {
        excludePackages: isOnlyWaitlist,
        optionIds: availableOptions.map((choice) => choice._id),
        packageIds: isOnlyWaitlist
          ? undefined
          : packages?.map((pkg) => pkg._id),
      }),
    [catalog, isOnlyWaitlist, availableOptions, packages],
  );

  const appliedOfferCatalogPath = React.useRef<string | null>(null);
  React.useEffect(() => {
    const optionId = waitlistOffer?.optionId ?? fromQuery;
    if (!optionId || appliedOfferCatalogPath.current === optionId) return;
    const path = catalogPathForOption(displayCatalog, optionId);
    if (path === undefined) return;
    setCatalogPath(path);
    appliedOfferCatalogPath.current = optionId;
  }, [waitlistOffer?.optionId, fromQuery, displayCatalog]);

  const startPackageBooking = async () => {
    if (isOnlyWaitlist) return;
    packageOtpVerifiedRef.current = false;
    setPackageBookingFlow(true);
    setPurchasePackageId(undefined);
    setCustomerPackageId(undefined);
    setOption(null);
    try {
      const session = await clientApi.customerAuth.checkSession();
      if (session?.success) {
        setOtpVerified(true);
        setPackageOtpOpen(false);
        setBookingFields({
          name: session.name || "",
          email: session.email || "",
          phone: session.phone || "",
        });
        await refreshBookingOptions?.();
        return;
      }
    } catch {
      // Fall through to OTP.
    }
    setPackageOtpOpen(true);
  };

  React.useEffect(() => {
    if (isOnlyWaitlist || !packageBookingFlow || !otpVerified) {
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
  }, [isOnlyWaitlist, packageBookingFlow, otpVerified]);

  const selectCustomerPackage = (pkg: CustomerPackage) => {
    const redeemableItem = pkg.items.find((item) => {
      const remaining = pkg.remainingByItem[item._id] ?? 0;
      const needed = creditsPerRedemptionForItem(item);
      return (
        remaining >= needed &&
        options.some((choice) => choice._id === item.optionId)
      );
    });
    const optionId = redeemableItem?.optionId;
    if (!optionId) {
      setPackagesError(true);
      return;
    }

    setCustomerPackageId(pkg._id);
    setPurchasePackageId(undefined);
    setOption(optionId);
    clientApi.booking.trackAdvanceFromUiStep("option", { optionId });
  };

  const exitPackageBooking = () => {
    packageOtpVerifiedRef.current = false;
    setPackageBookingFlow(false);
    setPackageOtpOpen(false);
    setCustomerPackageId(undefined);
    setOtpVerified(false);
    setMyPackages([]);
  };

  if (selected) {
    return (
      <Schedule
        className={cn(className)}
        appointmentOption={selected}
        members={members}
        flowOrder={flowOrder}
        preselectedMemberId={
          isSpecialistFirst ? specialistFirstMemberId : undefined
        }
        successPage={successPage}
        goBack={() => {
          setOption(null);
          if (packageBookingFlow) {
            setCustomerPackageId(undefined);
          } else {
            setPurchasePackageId(undefined);
          }
        }}
        fieldsSchema={fieldsSchema}
        showPromoCode={showPromoCode}
        bookingRestriction={bookingRestriction}
        id={id}
        waitlistAppId={appId}
        isEditor={isEditor}
        isOnlyWaitlist={isOnlyWaitlist}
        purchasePackageId={purchasePackageId}
        customerPackageId={customerPackageId}
        isCustomerPackageLocked={isCustomerPackageLocked}
        initialFields={
          isCustomerPackageLocked
            ? bookingFields
            : (waitlistOffer?.fields ?? undefined)
        }
        initialOtpVerified={isCustomerPackageLocked ? otpVerified : undefined}
        packages={packages}
        requireCustomerOtp={requireCustomerOtp}
        waitlistOffer={waitlistOffer}
        waitlistToken={waitlistTokenParam ?? undefined}
        {...props}
      />
    );
  }

  if (!isOnlyWaitlist && packageBookingFlow && otpVerified) {
    return (
      <div className="flex flex-col gap-4" id={id}>
        <div className="text-center">
          <h2 className="text-xl">{i18n("booking.package.selectPackage")}</h2>
          <p className="text-sm text-muted-foreground">
            {i18n("booking.package.selectPackageDescription")}
          </p>
        </div>
        {packagesLoading ? (
          <div className="grid gap-3">
            <Skeleton className="w-full h-24 rounded-lg" />
            <Skeleton className="w-full h-24 rounded-lg" />
          </div>
        ) : packagesError ? (
          <p className="text-sm text-destructive text-center">
            {i18n("booking.package.noPackages")}
          </p>
        ) : myPackages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">
            {i18n("booking.package.noPackages")}
          </p>
        ) : (
          <div className="grid gap-3">
            {myPackages.map((pkg) => (
              <button
                key={pkg._id}
                type="button"
                className="w-full p-4 rounded-lg border-2 text-left border-border hover:border-primary/50 hover:bg-accent/50"
                onClick={() => selectCustomerPackage(pkg)}
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
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start px-0"
          onClick={exitPackageBooking}
        >
          {i18n("common.buttons.back")}
        </Button>
      </div>
    );
  }

  if (isSpecialistFirst && !specialistFirstMemberId) {
    return (
      <div className="flex flex-col gap-2" id={id}>
        {isBookingRestricted && <BookingRestrictionBanner className="mb-4" />}
        <div className="text-center">
          <h2 className="text-xl">{i18n("booking.specialist.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {i18n("booking.specialist.choose")}
          </p>
        </div>
        <SpecialistList
          className={cn(className, optionsClassName)}
          staff={staffAcrossOptions.map((member) => ({ member }))}
          onSelect={(memberId) => {
            setSpecialistFirstMemberId(memberId);
            clientApi.booking.trackAdvanceFromUiStep("specialist", {
              memberId,
            });
          }}
        />
      </div>
    );
  }

  const { nodes: catalogNodes, group: catalogGroup } = catalogNodesAtPath(
    displayCatalog,
    catalogPath,
  );

  return (
    <>
      <BookingOtpDialog
        open={packageOtpOpen}
        onOpenChange={(open) => {
          setPackageOtpOpen(open);
          if (!open && !packageOtpVerifiedRef.current) exitPackageBooking();
        }}
        fields={bookingFields}
        hideContactFields={false}
        existingCustomerOnly
        description={i18n("booking.package.verifyToUseCreditsDescription")}
        onVerified={async (result) => {
          packageOtpVerifiedRef.current = true;
          setOtpVerified(true);
          setBookingFields({
            name: result.name || "",
            email: result.email || "",
            phone: result.phone || "",
          });
          await refreshBookingOptions?.();
        }}
      />
      {isBookingRestricted && <BookingRestrictionBanner className="mb-4" />}
      {displayCatalog.length ? (
        <div className="flex flex-col gap-2" id={id}>
          {catalogPath.length > 0 ? (
            <button
              type="button"
              className="text-sm underline text-muted-foreground self-start"
              onClick={() => setCatalogPath(catalogPath.slice(0, -1))}
            >
              {i18n("common.buttons.back")}
            </button>
          ) : null}
          {catalogGroup ? (
            <div className="text-center">
              <h2 className="text-xl">{catalogGroup.name}</h2>
              {catalogGroup.description ? (
                <Markdown
                  markdown={catalogGroup.description}
                  prose="simple"
                  className="text-sm text-muted-foreground [&_p]:my-0.5 [&_p]:leading-6"
                />
              ) : null}
            </div>
          ) : null}
          {!isOnlyWaitlist &&
          !catalogPath.length &&
          hasActiveCustomerPackages ? (
            <div className="rounded-lg border border-dashed p-4 space-y-2 package-booking-cta mb-2">
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
                className="min-h-9 h-auto text-wrap py-2"
                onClick={() => void startPackageBooking()}
              >
                {i18n("booking.package.bookWithPackage")}
              </Button>
            </div>
          ) : null}
          <CatalogCards
            nodes={catalogNodes}
            options={availableOptions}
            allOptions={options}
            packages={isOnlyWaitlist ? undefined : packages}
            members={members}
            isBookingRestricted={isBookingRestricted}
            className={cn(className, optionsClassName)}
            onSelectGroup={(id) => setCatalogPath([...catalogPath, id])}
            onSelectOption={(optionId) => {
              setPurchasePackageId(undefined);
              setCustomerPackageId(undefined);
              setPackageBookingFlow(false);
              setOption(optionId);
              clientApi.booking.trackAdvanceFromUiStep("option", {
                optionId,
              });
            }}
            onSelectPackage={(pkg) => {
              setPurchasePackageId(pkg._id);
              setCustomerPackageId(undefined);
              setPackageBookingFlow(false);
              setOption(pkg.items[0]?.optionId ?? null);
              clientApi.booking.trackAdvanceFromUiStep("option", {
                optionId: pkg.items[0]?.optionId,
              });
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2" id={id}>
          {!isOnlyWaitlist && hasActiveCustomerPackages ? (
            <div className="rounded-lg border border-dashed p-4 space-y-2 package-booking-cta mb-2">
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
          <AppointmentsCard
            options={availableOptions}
            members={members}
            onSelectOption={(optionId) => {
              setPurchasePackageId(undefined);
              setCustomerPackageId(undefined);
              setPackageBookingFlow(false);
              setOption(optionId);
              clientApi.booking.trackAdvanceFromUiStep("option", {
                optionId,
              });
            }}
            className={cn(className, optionsClassName)}
            id={id}
            isBookingRestricted={isBookingRestricted}
            {...props}
          />
        </div>
      )}
      {isSpecialistFirst && specialistFirstMemberId && (
        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-sm text-muted-foreground underline"
            onClick={() => setSpecialistFirstMemberId(null)}
          >
            {i18n("common.buttons.back")}
          </button>
        </div>
      )}
    </>
  );
};
