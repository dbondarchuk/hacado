"use server";

import {
  GIFT_CARD_STUDIO_APP_NAME,
  MY_CABINET_APP_NAME,
  WAITLIST_APP_NAME,
} from "@hacado/app-store";
import type { Language } from "@hacado/i18n";
import { getI18nAsync } from "@hacado/i18n/server";
import { getLoggerFactory } from "@hacado/logger";
import { deserializeMarkdown } from "@hacado/rte";
import { systemEventSource, type IServicesContainer } from "@hacado/types";
import { bookDefaultPage } from "../defaults/book";
import { footerDefaultPage } from "../defaults/footer";
import { giftCardsDefaultPage } from "../defaults/gift-cards";
import { homeDefaultPage, TemplateServiceArg } from "../defaults/home";
import { modifyDefaultPage } from "../defaults/modify";
import { myCabinetDefaultPage } from "../defaults/my-cabinet";
import { serviceDefaultPage } from "../defaults/service";

type CompleteInstallPagesInput = {
  services: IServicesContainer;
  isCancelRescheduleEnabled: boolean;
  isBlogEnabled: boolean;
  isMyCabinetEnabled: boolean;
  language: Language;
  businessName: string;
  hasAddress: boolean;
};

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

const DEFAULT_HEADER_NAME = "Default Header";
const DEFAULT_FOOTER_NAME = "Default Footer";
const DEFAULT_HOME_TITLE = "Home";

function getByPath(
  value: Record<string, unknown>,
  path: string,
): string | undefined {
  let current: unknown = value;
  for (const part of path.split(".")) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

function replaceSimpleTokens(
  template: string,
  context: Record<string, unknown>,
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, token) => {
    if (token === ".") {
      const self = context["."];
      return typeof self === "string" ? self : "";
    }
    const value = getByPath(context, token);
    return value ?? "";
  });
}

function toJsonString(value: unknown): string {
  return JSON.stringify(value);
}

async function getInstallPageDefaultsLabels(language: Language) {
  const logger = getLoggerFactory("InstallActions")(
    "getInstallPageDefaultsLabels",
  );
  logger.debug({ language }, "Resolving install page default labels");
  const t = await getI18nAsync({ locale: language, namespace: "install" });
  return {
    headerBookLabel: t("wizard.finish.pageDefaults.header.bookLabel"),
    headerBlogLabel: t("wizard.finish.pageDefaults.header.blogLabel"),
    headerMyCabinetLabel: t("wizard.finish.pageDefaults.header.myCabinetLabel"),
    footer: {
      contactUsLabel: t("wizard.finish.pageDefaults.footer.contactUsLabel"),
      phoneLabel: t("wizard.finish.pageDefaults.footer.phoneLabel"),
      emailLabel: t("wizard.finish.pageDefaults.footer.emailLabel"),
      addressLabel: t("wizard.finish.pageDefaults.footer.addressLabel"),
      bookNowLabel: t("wizard.finish.pageDefaults.footer.bookNowLabel"),
      cancelOrRescheduleLabel: t(
        "wizard.finish.pageDefaults.footer.cancelOrRescheduleLabel",
      ),
      policiesLabel: t("wizard.finish.pageDefaults.footer.policiesLabel"),
    },
    homeLabels: {
      title: t("wizard.finish.pageDefaults.home.title"),
      description: t("wizard.finish.pageDefaults.home.description"),
      cancelOrRescheduleLabel: t(
        "wizard.finish.pageDefaults.home.cancelOrRescheduleLabel",
      ),
      bookNowLabel: t("wizard.finish.pageDefaults.home.bookNowLabel"),
      ourServicesLabel: t("wizard.finish.pageDefaults.home.ourServicesLabel"),
      galleryLabel: t("wizard.finish.pageDefaults.home.galleryLabel"),
      learnMoreLabel: t("wizard.finish.pageDefaults.home.learnMoreLabel"),
    },
    bookLabels: {
      bookNowLabel: t("wizard.finish.pageDefaults.book.bookNowLabel"),
      manageYourAppointment: t(
        "wizard.finish.pageDefaults.book.manageYourAppointment",
      ),
      policiesText: t("wizard.finish.pageDefaults.book.policiesText"),
    },
    giftCardStudioLabels: {
      title: t("wizard.finish.pageDefaults.giftCards.title"),
    },
    myCabinetLabels: {
      title: t("wizard.finish.pageDefaults.myCabinet.title"),
    },
  };
}

async function getTemplateServices(
  services: IServicesContainer,
): Promise<TemplateServiceArg[]> {
  const logger = getLoggerFactory("InstallActions")("getTemplateServices");
  logger.debug("Building template services payload");
  const booking =
    (await services.configurationService.getConfiguration("booking")) ?? null;
  const optionIds = (booking?.options ?? [])
    .map((o) => o.id)
    .filter((id): id is string => Boolean(id));

  const output: TemplateServiceArg[] = [];
  for (const optionId of optionIds) {
    const option = await services.servicesService.getOption(optionId);
    if (!option) continue;

    const descriptionMarkdown =
      typeof option.description === "string" ? option.description : "";
    const descriptionPlate = deserializeMarkdown(descriptionMarkdown);

    const slug = generateSlug(option.name ?? "");
    output.push({
      id: optionId,
      name: String(option.name ?? "").trim() || "Service",
      description: descriptionPlate,
      slug,
      pageSlug: `service/${slug}`,
    });
  }

  logger.debug({ count: output.length }, "Built template services payload");
  return output;
}

async function upsertDefaultHeader(
  services: IServicesContainer,
  isBlogEnabled: boolean,
  isMyCabinetEnabled: boolean,
  isCancelRescheduleEnabled: boolean,
  bookLabel: string,
  blogLabel: string,
  myCabinetLabel: string,
  manageAppointmentLabel: string,
): Promise<string> {
  const logger = getLoggerFactory("InstallActions")("upsertDefaultHeader");
  logger.debug("Upserting default header");
  const pagesService = services.pagesService;
  const headers = await pagesService.getPageHeaders({
    search: DEFAULT_HEADER_NAME,
    limit: 50,
    offset: 0,
  });
  const existing = headers.items.find(
    (item) => item.name === DEFAULT_HEADER_NAME,
  );

  const headerData = {
    name: DEFAULT_HEADER_NAME,
    showLogo: true,
    sticky: false,
    shadow: "none" as const,
    menu: [
      ...(isBlogEnabled
        ? [
            {
              type: "button" as const,
              label: blogLabel,
              url: "/blog",
              variant: "ghost" as const,
              size: "default" as const,
            },
          ]
        : []),
      ...(isMyCabinetEnabled
        ? [
            {
              type: "button" as const,
              label: myCabinetLabel,
              url: "/my-cabinet",
              variant: "ghost" as const,
              size: "default" as const,
            },
          ]
        : isCancelRescheduleEnabled
          ? [
              {
                type: "button" as const,
                label: manageAppointmentLabel,
                url: "/book/modify",
                variant: "ghost" as const,
                size: "default" as const,
              },
            ]
          : []),
      {
        type: "button" as const,
        label: bookLabel,
        url: "/book",
        variant: "primary" as const,
        size: "default" as const,
      },
    ],
  };

  if (existing) {
    await pagesService.updatePageHeader(
      existing._id,
      headerData,
      systemEventSource,
    );
    logger.debug({ headerId: existing._id }, "Updated default header");
    return existing._id;
  }

  const created = await pagesService.createPageHeader(
    headerData,
    systemEventSource,
  );
  logger.debug({ headerId: created._id }, "Created default header");
  return created._id;
}

async function upsertDefaultFooter(
  services: IServicesContainer,
  hasAddress: boolean,
  footerLabels: Record<string, string>,
  isMyCabinetEnabled: boolean,
  isCancelRescheduleEnabled: boolean,
  myCabinetLabel: string,
  manageAppointmentLabel: string,
): Promise<string> {
  const logger = getLoggerFactory("InstallActions")("upsertDefaultFooter");
  logger.debug("Upserting default footer");
  const pagesService = services.pagesService;
  const footers = await pagesService.getPageFooters({
    search: DEFAULT_FOOTER_NAME,
    limit: 50,
    offset: 0,
  });
  const existing = footers.items.find(
    (item) => item.name === DEFAULT_FOOTER_NAME,
  );

  const footerContent = footerDefaultPage(
    hasAddress,
    footerLabels,
    isMyCabinetEnabled,
    isCancelRescheduleEnabled,
    myCabinetLabel,
    manageAppointmentLabel,
  );

  const footerData = {
    name: DEFAULT_FOOTER_NAME,
    content: footerContent,
  };

  if (existing) {
    await pagesService.updatePageFooter(
      existing._id,
      footerData,
      systemEventSource,
    );
    logger.debug({ footerId: existing._id }, "Updated default footer");
    return existing._id;
  }

  const created = await pagesService.createPageFooter(
    footerData,
    systemEventSource,
  );
  logger.debug({ footerId: created._id }, "Created default footer");
  return created._id;
}

async function upsertDefaultHomePage(
  services: IServicesContainer,
  args: {
    businessName: string;
    language: Language;
    headerId: string;
    footerId: string;
    homeLabels: Record<string, string>;
    templateServices: TemplateServiceArg[];
    isMyCabinetEnabled: boolean;
    isCancelRescheduleEnabled: boolean;
    myCabinetLabel: string;
    manageAppointmentLabel: string;
  },
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")("upsertDefaultHomePage");
  logger.debug("Upserting default home page");
  const pagesService = services.pagesService;
  const homePage = await pagesService.getPageBySlug("home");

  const homeContent = homeDefaultPage(
    args.templateServices,
    args.homeLabels,
    args.isMyCabinetEnabled,
    args.isCancelRescheduleEnabled,
    args.myCabinetLabel,
    args.manageAppointmentLabel,
  );

  const pageData = {
    title: DEFAULT_HOME_TITLE,
    description: `${args.businessName} home page`,
    keywords: `${args.businessName}, booking, services`,
    slug: "home",
    published: true,
    publishDate: new Date(),
    headerId: args.headerId,
    footerId: args.footerId,
    content: homeContent,
  };

  if (homePage) {
    await pagesService.updatePage(homePage._id, pageData, systemEventSource);
    logger.debug(
      { pageId: homePage._id, slug: "home" },
      "Updated default home page",
    );
    return;
  }

  await pagesService.createPage(pageData, systemEventSource);
  logger.debug({ slug: "home" }, "Created default home page");
}

async function upsertDefaultBookPage(
  services: IServicesContainer,
  args: {
    businessName: string;
    language: Language;
    headerId: string;
    footerId: string;
    bookLabels: Record<string, string>;
  },
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")("upsertDefaultBookPage");
  logger.debug("Upserting default book page");
  const pagesService = services.pagesService;
  const bookPage = await pagesService.getPageBySlug("book");
  const waitlistApp = (
    await services.connectedAppsService.getAppsByApp(WAITLIST_APP_NAME)
  )[0];

  const bookContent = bookDefaultPage(waitlistApp?._id, args.bookLabels);

  const pageData = {
    title: args.bookLabels.bookNowLabel || "Book now",
    description: `${args.businessName} booking page`,
    keywords: `${args.businessName}, book, appointment`,
    slug: "book",
    published: true,
    publishDate: new Date(),
    headerId: args.headerId,
    footerId: args.footerId,
    content: bookContent,
  };

  if (bookPage) {
    await pagesService.updatePage(bookPage._id, pageData, systemEventSource);
    logger.debug(
      { pageId: bookPage._id, slug: "book" },
      "Updated default book page",
    );
    return;
  }

  await pagesService.createPage(pageData, systemEventSource);
  logger.debug({ slug: "book" }, "Created default book page");
}

async function upsertDefaultModifyPage(
  services: IServicesContainer,
  isCancelRescheduleEnabled: boolean,
  args: {
    businessName: string;
    language: Language;
    headerId: string;
    footerId: string;
    bookLabels: Record<string, string>;
  },
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")("upsertDefaultModifyPage");
  logger.debug("Upserting default modify page");
  const pagesService = services.pagesService;
  const modifyPage = await pagesService.getPageBySlug("book/modify");

  const modifyContent = modifyDefaultPage(args.bookLabels);

  const pageData = {
    title: args.bookLabels.manageYourAppointment || "Manage appointment",
    description: `${args.businessName} modify appointment page`,
    keywords: `${args.businessName}, appointment, modify, cancel, reschedule`,
    slug: "book/modify",
    published: isCancelRescheduleEnabled,
    publishDate: new Date(),
    headerId: args.headerId,
    footerId: args.footerId,
    content: modifyContent,
  };

  if (modifyPage) {
    await pagesService.updatePage(modifyPage._id, pageData, systemEventSource);
    logger.debug(
      { pageId: modifyPage._id, slug: "book/modify" },
      "Updated default modify page",
    );
    return;
  }

  await pagesService.createPage(pageData, systemEventSource);
  logger.debug({ slug: "book/modify" }, "Created default modify page");
}

async function upsertDefaultGiftCardsPage(
  services: IServicesContainer,
  args: {
    businessName: string;
    language: Language;
    headerId: string;
    footerId: string;
    giftCardStudioLabels: Record<string, string>;
  },
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")(
    "upsertDefaultGiftCardsPage",
  );
  logger.debug("Upserting default gift cards page");
  const giftCardStudioApp = (
    await services.connectedAppsService.getAppsByApp(GIFT_CARD_STUDIO_APP_NAME)
  )[0];

  if (!giftCardStudioApp) {
    logger.debug("Gift card studio app not installed");
    return;
  }

  const giftCardStudioAppId = giftCardStudioApp._id;

  const pagesService = services.pagesService;
  const giftCardsPage = await pagesService.getPageBySlug("gift-cards");

  const giftCardsContent = giftCardsDefaultPage(
    giftCardStudioAppId,
    args.giftCardStudioLabels,
  );

  const pageData = {
    title: args.giftCardStudioLabels.title || "Gift cards",
    description: `${args.businessName} purchase gift cards`,
    keywords: `${args.businessName}, gift cards`,
    slug: "gift-cards",
    published: true,
    publishDate: new Date(),
    headerId: args.headerId,
    footerId: args.footerId,
    content: giftCardsContent,
  };

  if (giftCardsPage) {
    await pagesService.updatePage(
      giftCardsPage._id,
      pageData,
      systemEventSource,
    );
    logger.debug(
      { pageId: giftCardsPage._id, slug: "gift-cards" },
      "Updated default gift cards page",
    );
    return;
  }

  await pagesService.createPage(pageData, systemEventSource);
  logger.debug({ slug: "gift-cards" }, "Created default gift cards page");
}

export async function upsertInstallMyCabinetDefaultPage(
  services: IServicesContainer,
  args: {
    businessName: string;
    language: Language;
    headerId: string;
    footerId: string;
    myCabinetLabels: { title: string };
  },
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")(
    "upsertInstallMyCabinetDefaultPage",
  );
  logger.debug({}, "Upserting My Cabinet install default page");

  const myCabinetApp = (
    await services.connectedAppsService.getAppsByApp(MY_CABINET_APP_NAME)
  )[0];

  if (!myCabinetApp) {
    logger.debug("My Cabinet app not installed; skipping page");
    return;
  }

  const pagesService = services.pagesService;
  const existing = await pagesService.getPageBySlug("my-cabinet");

  const title = args.myCabinetLabels.title;
  const content = myCabinetDefaultPage(myCabinetApp._id, { title });

  const pageData = {
    title,
    description: `${args.businessName} customer account`,
    keywords: `${args.businessName}, account, appointments`,
    slug: "my-cabinet",
    published: true,
    publishDate: new Date(),
    headerId: args.headerId,
    footerId: args.footerId,
    content,
  };

  if (existing) {
    await pagesService.updatePage(existing._id, pageData, systemEventSource);
    logger.debug(
      { pageId: existing._id, slug: "my-cabinet" },
      "Updated default My Cabinet page",
    );
    return;
  }

  await pagesService.createPage(pageData, systemEventSource);
  logger.debug({ slug: "my-cabinet" }, "Created default My Cabinet page");
}

async function upsertDefaultServicesPage(
  services: IServicesContainer,
  args: {
    businessName: string;
    language: Language;
    headerId: string;
    footerId: string;
    services: TemplateServiceArg[];
    bookLabels: Record<string, string>;
  },
): Promise<void> {
  const logger = getLoggerFactory("InstallActions")(
    "upsertDefaultServicesPage",
  );
  logger.debug("Upserting default services pages for each service");
  const pagesService = services.pagesService;

  for (const service of args.services) {
    logger.debug(
      { serviceId: service.id, serviceName: service.name },
      "Upserting default services page for service",
    );

    const servicesPage = await pagesService.getPageBySlug(service.pageSlug);

    const servicesContent = serviceDefaultPage(service, args.bookLabels);

    const pageData = {
      title: service.name,
      description: `${args.businessName} ${service.name}`,
      keywords: `${args.businessName}, service, ${service.name}`,
      slug: service.pageSlug,
      published: true,
      publishDate: new Date(),
      headerId: args.headerId,
      footerId: args.footerId,
      content: servicesContent,
    };

    if (servicesPage) {
      await pagesService.updatePage(
        servicesPage._id,
        pageData,
        systemEventSource,
      );
      logger.debug(
        {
          pageId: servicesPage._id,
          slug: service.pageSlug,
          serviceId: service.id,
          serviceName: service.name,
        },
        "Updated default services page for service",
      );
      continue;
    }

    await pagesService.createPage(pageData, systemEventSource);
    logger.debug(
      {
        slug: service.pageSlug,
        serviceId: service.id,
        serviceName: service.name,
      },
      "Created default services page for service",
    );
  }

  logger.debug("Created default services pages for each service");
}

export async function createInstallDefaultPages(
  input: CompleteInstallPagesInput,
): Promise<{
  headerId: string;
  footerId: string;
  labels: Awaited<ReturnType<typeof getInstallPageDefaultsLabels>>;
}> {
  const logger = getLoggerFactory("InstallActions")(
    "createInstallDefaultPages",
  );
  logger.debug({ language: input.language }, "Creating install default pages");

  const labels = await getInstallPageDefaultsLabels(input.language);
  const templateServices = await getTemplateServices(input.services);
  const myCabinetLabel = labels.headerMyCabinetLabel;
  const manageAppointmentLabel = labels.bookLabels.manageYourAppointment;
  const headerId = await upsertDefaultHeader(
    input.services,
    input.isBlogEnabled,
    input.isMyCabinetEnabled,
    input.isCancelRescheduleEnabled,
    labels.headerBookLabel,
    labels.headerBlogLabel,
    myCabinetLabel,
    manageAppointmentLabel,
  );

  const footerId = await upsertDefaultFooter(
    input.services,
    input.hasAddress,
    labels.footer,
    input.isMyCabinetEnabled,
    input.isCancelRescheduleEnabled,
    myCabinetLabel,
    manageAppointmentLabel,
  );

  await upsertDefaultHomePage(input.services, {
    businessName: input.businessName,
    language: input.language,
    headerId,
    footerId,
    homeLabels: labels.homeLabels,
    templateServices,
    isMyCabinetEnabled: input.isMyCabinetEnabled,
    isCancelRescheduleEnabled: input.isCancelRescheduleEnabled,
    myCabinetLabel,
    manageAppointmentLabel,
  });

  await upsertDefaultBookPage(input.services, {
    businessName: input.businessName,
    language: input.language,
    headerId,
    footerId,
    bookLabels: labels.bookLabels,
  });

  await upsertDefaultModifyPage(
    input.services,
    input.isCancelRescheduleEnabled,
    {
      businessName: input.businessName,
      language: input.language,
      headerId,
      footerId,
      bookLabels: labels.bookLabels,
    },
  );

  await upsertDefaultServicesPage(input.services, {
    businessName: input.businessName,
    language: input.language,
    headerId,
    footerId,
    services: templateServices,
    bookLabels: labels.bookLabels,
  });

  await upsertDefaultGiftCardsPage(input.services, {
    businessName: input.businessName,
    language: input.language,
    headerId,
    footerId,
    giftCardStudioLabels: labels.giftCardStudioLabels,
  });

  logger.debug({ language: input.language }, "Created install default pages");
  return { headerId, footerId, labels };
}
