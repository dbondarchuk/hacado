export const COMMAND_SEARCH_SCOPES = [
  "customers",
  "appointments",
  "pages",
  "headers",
  "footers",
  "templates",
  "options",
  "addons",
  "fields",
  "discounts",
  "gift-cards",
  "packages",
  "assets",
  "team",
  "blog",
  "blog-posts",
  "blog-comments",
  "forms",
  "waitlist",
  "gift-card-studio",
  "gift-card-designs",
  "gift-card-purchases",
  "apps",
  "actions",
  "navigation",
] as const;

export type CommandSearchScope = (typeof COMMAND_SEARCH_SCOPES)[number];

const CORE_SCOPES = new Set<CommandSearchScope>([
  "customers",
  "appointments",
  "pages",
  "headers",
  "footers",
  "templates",
  "options",
  "addons",
  "fields",
  "discounts",
  "gift-cards",
  "packages",
  "assets",
  "team",
]);

const APP_SCOPES = new Set<CommandSearchScope>([
  "blog",
  "blog-posts",
  "blog-comments",
  "forms",
  "waitlist",
  "gift-card-studio",
  "gift-card-designs",
  "gift-card-purchases",
]);

const ALIASES: Record<string, CommandSearchScope> = {
  customer: "customers",
  customers: "customers",
  appointment: "appointments",
  appointments: "appointments",
  page: "pages",
  pages: "pages",
  header: "headers",
  headers: "headers",
  footer: "footers",
  footers: "footers",
  template: "templates",
  templates: "templates",
  email: "templates",
  option: "options",
  options: "options",
  service: "options",
  services: "options",
  addon: "addons",
  addons: "addons",
  "add-on": "addons",
  "add-ons": "addons",
  field: "fields",
  fields: "fields",
  discount: "discounts",
  discounts: "discounts",
  "gift card": "gift-cards",
  "gift cards": "gift-cards",
  giftcard: "gift-cards",
  giftcards: "gift-cards",
  "gift-card": "gift-cards",
  "gift-cards": "gift-cards",
  package: "packages",
  packages: "packages",
  asset: "assets",
  assets: "assets",
  team: "team",
  member: "team",
  members: "team",
  blog: "blog",
  post: "blog-posts",
  posts: "blog-posts",
  "blog post": "blog-posts",
  "blog posts": "blog-posts",
  "blog-post": "blog-posts",
  "blog-posts": "blog-posts",
  comment: "blog-comments",
  comments: "blog-comments",
  "blog comment": "blog-comments",
  "blog comments": "blog-comments",
  "blog-comment": "blog-comments",
  "blog-comments": "blog-comments",
  form: "forms",
  forms: "forms",
  waitlist: "waitlist",
  design: "gift-card-designs",
  designs: "gift-card-designs",
  purchase: "gift-card-purchases",
  purchases: "gift-card-purchases",
  studio: "gift-card-studio",
  "gift card studio": "gift-card-studio",
  "gift-card-studio": "gift-card-studio",
  "gift-card-designs": "gift-card-designs",
  "gift-card-purchases": "gift-card-purchases",
  app: "apps",
  apps: "apps",
  action: "actions",
  actions: "actions",
  nav: "navigation",
  navigation: "navigation",
};

export function parseSearchScope(value: string) {
  const key = value.trim().toLowerCase().replace(/\s+/g, " ");
  return ALIASES[key];
}

export function parseCommandQuery(raw: string): {
  scope?: CommandSearchScope;
  text: string;
} {
  const match = raw.match(/^([a-z0-9][a-z0-9 -]*):\s*([\s\S]*)$/i);
  if (!match) return { text: raw.trim() };

  const scope = parseSearchScope(match[1]);
  if (!scope) return { text: raw.trim() };

  return { scope, text: match[2].trim() };
}

export function isCoreSearchScope(scope: CommandSearchScope) {
  return CORE_SCOPES.has(scope);
}

export function isAppSearchScope(scope: CommandSearchScope) {
  return APP_SCOPES.has(scope);
}

export function isRemoteSearchScope(scope?: CommandSearchScope) {
  if (!scope) return true;

  return isCoreSearchScope(scope) || isAppSearchScope(scope);
}

export function scopesForHref(href: string): CommandSearchScope[] {
  const path = href.split("?")[0] ?? href;
  if (path.includes("/dashboard/customers")) return ["customers"];
  if (path.includes("/dashboard/appointments")) return ["appointments"];
  if (path.includes("/dashboard/pages/headers")) return ["headers"];
  if (path.includes("/dashboard/pages/footers")) return ["footers"];
  if (path.includes("/dashboard/pages")) return ["pages"];
  if (path.includes("/dashboard/templates")) return ["templates"];
  if (path.includes("/dashboard/catalog/services")) return ["options"];
  if (path.includes("/dashboard/catalog/addons")) return ["addons"];
  if (path.includes("/dashboard/catalog/fields")) return ["fields"];
  if (path.includes("/dashboard/catalog/discounts")) return ["discounts"];
  if (path.includes("/dashboard/catalog/gift-cards")) return ["gift-cards"];
  if (path.includes("/dashboard/catalog/packages")) return ["packages"];
  if (path.includes("/dashboard/assets")) return ["assets"];
  if (path.includes("/dashboard/settings/team")) return ["team"];
  if (path.includes("/dashboard/gift-card-studio/purchases")) {
    return ["gift-card-studio", "gift-card-purchases"];
  }
  if (path.includes("/dashboard/gift-card-studio/settings")) {
    return ["gift-card-studio"];
  }
  if (path.includes("/dashboard/gift-card-studio")) {
    return ["gift-card-studio", "gift-card-designs"];
  }
  if (path.includes("/dashboard/blog/comments"))
    return ["blog", "blog-comments"];
  if (path.includes("/dashboard/blog")) return ["blog", "blog-posts"];
  if (path.includes("/dashboard/forms")) return ["forms"];
  if (path.includes("/dashboard/waitlist")) return ["waitlist"];
  if (path.includes("/dashboard/apps")) return ["apps"];

  return [];
}

export function pathKeywords(href: string) {
  if (!href.startsWith("/")) return "";

  return href
    .split(/[/?#]+/)
    .filter((part) => part && part !== "dashboard")
    .join(" ");
}
