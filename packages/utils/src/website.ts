export const getWebsiteDomain = ({
  domain,
  slug,
}: {
  domain?: string | null;
  slug: string;
}) => {
  return domain ? domain : `${slug}.${process.env.PUBLIC_DOMAIN}`;
};

export const getWebsiteUrl = ({
  slug,
  domain,
}: {
  slug: string;
  domain?: string | null;
}) => {
  const schema = domain?.startsWith("localhost") ? "http" : "https";
  return `${schema}://${getWebsiteDomain({ domain, slug })}`;
};

export const getAdminUrl = () => {
  const schema = process.env.ADMIN_DOMAIN?.startsWith("localhost")
    ? "http"
    : "https";
  return `${schema}://${process.env.ADMIN_DOMAIN}`;
};

export const getAppsExternalUrl = () => {
  const schema = process.env.APPS_EXTERNAL_DOMAIN?.startsWith("localhost")
    ? "http"
    : "https";
  return `${schema}://${process.env.APPS_EXTERNAL_DOMAIN}`;
};
