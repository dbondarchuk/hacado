import { Customer } from "@hacado/types";
import React from "react";
import { ResponsesTable } from "./responses/table/table";
import { ResponsesTableAction } from "./responses/table/table-action";

export const FormsCustomerTab: React.FC<{
  appId: string;
  customer: Customer;
  props: unknown;
  searchParams: { [key: string]: string | string[] | undefined };
}> = ({ appId, customer }) => {
  const returnUrl = `/dashboard/customers/${customer._id}/forms`;

  return (
    <div className="flex flex-col flex-1 gap-8">
      <ResponsesTableAction
        appId={appId}
        customerIdLock={customer._id}
        disableNewResponseLink={customer.isDeleted}
        returnUrl={returnUrl}
      />
      <ResponsesTable appId={appId} customerIdLock={customer._id} />
    </div>
  );
};
