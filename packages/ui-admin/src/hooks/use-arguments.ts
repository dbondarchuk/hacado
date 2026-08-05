import { adminApi } from "@hacado/api-sdk";
import React from "react";

export const useArguments = (
  options: { customerId: string } | { appointmentId: string },
) => {
  const [args, setArguments] = React.useState<any>({});

  const customerId = "customerId" in options ? options.customerId : undefined;
  const appointmentId =
    "appointmentId" in options ? options.appointmentId : undefined;

  React.useEffect(() => {
    adminApi.templates
      .getTemplateArguments(
        customerId
          ? { customerId: customerId! }
          : { appointmentId: appointmentId! },
      )
      .then((args) => setArguments(args));
  }, [customerId, appointmentId]);

  return args;
};
