"use client";

import { CustomerPackageListModel } from "@hacado/types";
import { cn } from "@hacado/ui";
import React from "react";
import { AdjustPackageCreditsDialog } from "./adjust-package-credits-dialog";
import { CancelCustomerPackageDialog } from "./cancel-customer-package-dialog";
import { ReactivateCustomerPackageDialog } from "./reactivate-customer-package-dialog";

type CustomerPackageActionsProps = {
  pkg: CustomerPackageListModel;
  className?: string;
};

export const CustomerPackageActions: React.FC<CustomerPackageActionsProps> = ({
  pkg,
  className,
}) => {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <AdjustPackageCreditsDialog pkg={pkg} />
      <ReactivateCustomerPackageDialog pkg={pkg} />
      <CancelCustomerPackageDialog pkg={pkg} />
    </div>
  );
};
