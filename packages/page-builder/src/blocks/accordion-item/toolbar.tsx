import { ConfigurationProps } from "@timelish/builder";
import { useI18n } from "@timelish/i18n/client";
import { AccordionItemProps } from "./schema";

export const AccordionItemToolbar = (
  props: ConfigurationProps<AccordionItemProps>,
) => {
  const t = useI18n("builder");

  return <>{/* No shortcuts for accordion item */}</>;
};
