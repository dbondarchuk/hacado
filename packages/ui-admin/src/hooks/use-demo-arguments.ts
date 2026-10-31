import { templatesApi } from "@hacado/api-sdk/admin/templates";
import React from "react";

export const useDemoArguments = (options?: { noAppointment?: boolean }) => {
  const [demoArguments, setDemoArguments] = React.useState<any>({});

  React.useEffect(() => {
    templatesApi
      .getDemoTemplateArguments(options)
      .then((args) => setDemoArguments(args));
  }, []);

  return demoArguments;
};
