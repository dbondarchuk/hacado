import { ConfigurationProps } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { AccordionProps } from "./schema";

export const AccordionToolbar = (props: ConfigurationProps<AccordionProps>) => {
  const t = useI18n("builder");

  return <>{/* No shortcuts for accordion */}</>;
};
