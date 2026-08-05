import { Customer } from "@hacado/types";
import React from "react";
import { WaitlistTable } from "./table/table";
import { WaitlistTableAction } from "./table/table-action";

export const WaitlistCustomerTab: React.FC<{
  appId: string;
  customer: Customer;
  props: unknown;
  searchParams: { [key: string]: string | string[] | undefined };
}> = ({ appId, customer }) => {
  return (
    <div className="flex flex-col flex-1 gap-8">
      <WaitlistTableAction appId={appId} customerIdLock={customer._id} />
      <WaitlistTable appId={appId} customerIdLock={customer._id} />
    </div>
  );
};
