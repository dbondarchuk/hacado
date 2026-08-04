import { ConfigurationProps } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { AccordionProps } from "./schema";

export const AccordionToolbar = (props: ConfigurationProps<AccordionProps>) => {
  const t = useI18n("builder");

  return <>{/* No shortcuts for accordion */}</>;
};
