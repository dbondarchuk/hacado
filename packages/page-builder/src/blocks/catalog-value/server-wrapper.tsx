import { CatalogValueComponent } from "./component";
import { formatCatalogPrice, resolveCatalogValue } from "./format";
import { getCatalogFormatContext, getCatalogRecord } from "./load-record";
import { isMultilineProperty } from "./properties";
import { CatalogValueProps, CatalogValuePropsDefaults } from "./schema";

type CatalogValueServerWrapperProps = {
  props: CatalogValueProps["props"];
  style?: CatalogValueProps["style"];
  blockBase?: { className?: string; id?: string };
};

export const CatalogValueServerWrapper = async ({
  props,
  style,
  blockBase,
}: CatalogValueServerWrapperProps) => {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const organizationId = headersList.get("x-organization-id");
  const source = props?.source ?? CatalogValuePropsDefaults.props.source;
  const itemId = props?.itemId;
  const property = props?.property ?? CatalogValuePropsDefaults.props.property;

  const [record, formatContext] =
    organizationId && itemId
      ? await Promise.all([
          getCatalogRecord(organizationId, source, itemId),
          getCatalogFormatContext(organizationId),
        ])
      : [null, null];

  const resolved = resolveCatalogValue({
    record,
    source,
    property,
    stripFormatting: props?.stripFormatting,
    durationFormat: props?.durationFormat,
    durationStyle: props?.durationStyle,
    formatPrice: (amount, options) =>
      formatContext
        ? formatCatalogPrice(
            amount,
            formatContext.language,
            formatContext.currency,
            options,
          )
        : String(amount),
    showCurrency: props?.showCurrency,
    alwaysShowCents: props?.alwaysShowCents,
  });

  return (
    <CatalogValueComponent
      resolved={resolved}
      multiline={isMultilineProperty(source, property)}
      style={style}
      blockBase={blockBase}
    />
  );
};
