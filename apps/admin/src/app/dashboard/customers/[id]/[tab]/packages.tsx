import { getServicesContainer } from "@/app/utils";
import { newAppointmentHrefForCustomerPackage } from "@/components/admin/catalog/packages/new-appointment-href";
import { serializeAppointmentsSearchParams } from "@hacado/api-sdk";
import { I18nText } from "@hacado/i18n/components";
import {
  appointmentStatuses,
  CustomerPackageListModel,
} from "@hacado/types/booking";
import { CustomerPackageActions } from "@hacado/ui-admin-kit";
import { Badge } from "@hacado/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@hacado/ui/card";
import { Link } from "@hacado/ui/link";
import { Skeleton } from "@hacado/ui/skeleton";
import { CalendarDays, CalendarPlus } from "lucide-react";
import { Suspense } from "react";

const PackageCard = ({ pkg }: { pkg: CustomerPackageListModel }) => {
  const newAppointmentHref = newAppointmentHrefForCustomerPackage(pkg);
  const appointmentsHref = `/dashboard/appointments${serializeAppointmentsSearchParams(
    {
      customerPackageId: pkg._id,
      status: [...appointmentStatuses],
    },
  )}`;

  return (
    <Card key={pkg._id} id={`package-${pkg._id}`}>
      <CardHeader>
        <CardTitle className="text-base justify-between flex items-center gap-2 flex-wrap">
          <span>{pkg.name}</span>
          <Badge variant="outline">
            <I18nText
              namespace="admin"
              text={`catalog.packages.sold.statusBadges.${pkg.status}`}
            />
          </Badge>
        </CardTitle>
        <CardDescription>
          <div className="text-sm text-muted-foreground">
            <I18nText
              namespace="admin"
              text={`catalog.packages.customer.remaining`}
              args={{
                remaining: pkg.remainingCredits,
                total: pkg.totalCredits,
              }}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <I18nText
              namespace="admin"
              text={`catalog.packages.customer.used`}
              args={{
                used: pkg.usedCredits,
                total: pkg.totalCredits,
              }}
            />
          </div>
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-wrap gap-2">
        <Link button href={appointmentsHref} variant="outline" size="sm">
          <CalendarDays className="size-4" />
          <I18nText
            namespace="admin"
            text="catalog.packages.customer.viewAppointments"
          />
        </Link>
        {newAppointmentHref ? (
          <Link button href={newAppointmentHref} variant="outline" size="sm">
            <CalendarPlus className="size-4" />
            <I18nText
              namespace="admin"
              text="catalog.packages.customer.scheduleAppointment"
            />
          </Link>
        ) : null}
        <CustomerPackageActions pkg={pkg} />
      </CardFooter>
    </Card>
  );
};

export const PackageCardSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base justify-between flex items-center gap-2 flex-wrap mb-2">
          <Skeleton className="w-40 max-w-full h-4" />
          <Skeleton className="w-20 h-4" />
        </CardTitle>
        <CardDescription className="flex flex-col gap-2">
          <Skeleton className="w-64 h-4" />
          <Skeleton className="w-64 h-4" />
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex flex-row flex-wrap gap-2">
        <Skeleton className="w-40 h-4" />
        <Skeleton className="w-40 h-4" />
      </CardFooter>
    </Card>
  );
};

const PackagesListSkeleton = () => {
  return (
    <div className="flex flex-col gap-3">
      <PackageCardSkeleton />
      <PackageCardSkeleton />
      <PackageCardSkeleton />
    </div>
  );
};

const PackagesList = async ({ customerId }: { customerId: string }) => {
  const servicesContainer = await getServicesContainer();
  const { items } = await servicesContainer.packagesService.getCustomerPackages(
    {
      customerId,
      offset: 0,
      limit: 50,
    },
  );

  if (!items.length) {
    return (
      <div className="text-sm text-center py-4 border rounded-md bg-card text-card-foreground">
        <I18nText
          namespace="admin"
          text="catalog.packages.customer.noPackages"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((pkg) => (
        <PackageCard key={pkg._id} pkg={pkg} />
      ))}
    </div>
  );
};

export const CustomerPackagesList = ({
  customerId,
}: {
  customerId: string;
}) => {
  return (
    <Suspense fallback={<PackagesListSkeleton />}>
      <PackagesList customerId={customerId} />
    </Suspense>
  );
};
