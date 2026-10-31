import { templatesApi } from "@hacado/api-sdk/admin/templates";
import React from "react";

export const useArguments = (
  options: { customerId: string } | { appointmentId: string },
) => {
  const [args, setArguments] = React.useState<any>({});

  const customerId = "customerId" in options ? options.customerId : undefined;
  const appointmentId =
    "appointmentId" in options ? options.appointmentId : undefined;

  React.useEffect(() => {
    templatesApi
      .getTemplateArguments(
        customerId
          ? { customerId: customerId! }
          : { appointmentId: appointmentId! },
      )
      .then((args) => setArguments(args));
  }, [customerId, appointmentId]);

  return args;
};
