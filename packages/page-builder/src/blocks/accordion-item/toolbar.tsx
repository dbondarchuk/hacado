import { ConfigurationProps } from "@hacado/builder";
import { useI18n } from "@hacado/i18n/client";
import { AccordionItemProps } from "./schema";

export const AccordionItemToolbar = (
  props: ConfigurationProps<AccordionItemProps>,
) => {
  const t = useI18n("builder");

  return <>{/* No shortcuts for accordion item */}</>;
};
