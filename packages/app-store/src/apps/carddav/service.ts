// Replace your CarddavConnectedApp class with this version (keeps your helpers)
import { getLoggerFactory, LoggerFactory } from "@hacado/logger";
import {
  ConnectedAppData,
  ConnectedAppStatusWithText,
  Customer,
  IConnectedApp,
  IConnectedAppProps,
} from "@hacado/types";
import { decrypt, encrypt } from "@hacado/utils";
import crypto from "crypto";
import {
  CarddavConfiguration,
  CarddavRequest,
  CarddavRequestGetConfigurationActionResponse,
  CarddavRequestInstallActionResponse,
  CarddavRequestResetPasswordActionResponse,
} from "./models";
import {
  CarddavAdminAllKeys,
  CarddavAdminKeys,
  CarddavAdminNamespace,
} from "./translations/types";

function generatePassword(): string {
  return crypto.randomBytes(12).toString("hex");
}

function generateCarddavUrl(organizationId: string, appId: string): string {
  return `https://${process.env.APPS_EXTERNAL_DOMAIN}/api/apps/${organizationId}/${appId}`;
}

/* (Keep your escapeVCardText and customerToVCard helpers unchanged) */
function escapeVCardText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function customerToVCard(customer: Customer): string {
  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];

  lines.push(`UID:${customer._id}`);

  const nameParts = customer.name.split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";
  lines.push(`FN:${escapeVCardText(customer.name)}`);
  if (firstName || lastName) {
    lines.push(
      `N:${escapeVCardText(lastName)};${escapeVCardText(firstName)};;;`,
    );
  }

  if (customer.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${customer.email}`);
  }
  if (customer.knownEmails && customer.knownEmails.length > 0) {
    customer.knownEmails.forEach((email) => {
      lines.push(`EMAIL;TYPE=INTERNET:${email}`);
    });
  }

  if (customer.phone) {
    lines.push(`TEL;TYPE=CELL:${customer.phone}`);
  }
  if (customer.knownPhones && customer.knownPhones.length > 0) {
    customer.knownPhones.forEach((phone) => {
      lines.push(`TEL;TYPE=CELL:${phone}`);
    });
  }

  if (customer.dateOfBirth) {
    const dob = new Date(customer.dateOfBirth);
    const year = dob.getFullYear();
    const month = String(dob.getMonth() + 1).padStart(2, "0");
    const day = String(dob.getDate()).padStart(2, "0");
    lines.push(`BDAY:${year}${month}${day}`);
  }

  if (customer.note) {
    lines.push(`NOTE:${escapeVCardText(customer.note)}`);
  }

  const url = `https://${process.env.ADMIN_DOMAIN}/dashboard/customers/${customer._id}`;
  lines.push(`URL:${url}`);

  lines.push(
    `REV:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
  );

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

function parseBasicAuth(
  authHeader: string | null,
): { username: string; password: string } | null {
  if (!authHeader || !authHeader.startsWith("Basic ")) return null;
  try {
    const base64 = authHeader.substring(6);
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    const [username, password] = decoded.split(":", 2);
    return { username, password };
  } catch {
    return null;
  }
}

function validateAuth(
  request: Request,
  config: CarddavConfiguration | undefined,
): boolean {
  if (!config || (!config.username && !config.password)) return true;
  const authHeader = request.headers.get("authorization");
  const credentials = parseBasicAuth(authHeader);
  if (!credentials) return false;
  const expectedUsername = config.username || "";
  const expectedPassword = config.password || "";
  return (
    credentials.username === expectedUsername &&
    credentials.password === expectedPassword
  );
}

export default class CarddavConnectedApp
  implements IConnectedApp<CarddavConfiguration>
{
  protected readonly loggerFactory: LoggerFactory;

  public constructor(protected readonly props: IConnectedAppProps) {
    this.loggerFactory = getLoggerFactory(
      "CarddavConnectedApp",
      props.organizationId,
    );
  }

  public async processRequest(
    appData: ConnectedAppData,
    data: CarddavRequest,
  ): Promise<any> {
    const logger = this.loggerFactory("processRequest");
    logger.debug(
      {
        appId: appData._id,
        type: data.type,
      },
      "Processing CardDAV configuration request",
    );

    switch (data.type) {
      case "reset-password":
        return this.resetPassword(appData);
      case "get-configuration":
        return this.getConfiguration(appData);
      case "install":
      default:
        return this.installApp(appData);
    }
  }

  private async resetPassword(appData: ConnectedAppData) {
    const logger = this.loggerFactory("resetPassword");
    const password = generatePassword();
    const encryptedPassword = encrypt(password);
    const status: ConnectedAppStatusWithText<
      CarddavAdminNamespace,
      CarddavAdminKeys
    > = {
      status: "connected",
      statusText:
        "app_carddav_admin.statusText.successfullySetUp" satisfies CarddavAdminAllKeys,
    };

    await this.props.update({
      data: {
        ...appData.data,
        password: encryptedPassword,
      },
      ...status,
    });

    logger.debug(
      {
        appId: appData._id,
        status: status.status,
      },
      "Successfully reset CardDAV password",
    );

    return {
      password,
    } satisfies CarddavRequestResetPasswordActionResponse;
  }

  private async getUsername(appData: ConnectedAppData) {
    const logger = this.loggerFactory("getUsername");
    const organization =
      await this.props.services.organizationService.getOrganization();

    if (!organization) {
      logger.error({ appId: appData._id }, "Organization not found");
      throw new Error("Organization not found");
    }

    logger.debug(
      { appId: appData._id, organizationSlug: organization.slug },
      "Successfully got organization slug",
    );

    return organization.slug;
  }

  private async getConfiguration(appData: ConnectedAppData) {
    const logger = this.loggerFactory("getConfiguration");
    const username = await this.getUsername(appData);

    const configuration: CarddavConfiguration = {
      username,
      password: decrypt(appData.data.password),
      carddavUrl: generateCarddavUrl(appData.organizationId, appData._id),
    };

    logger.debug(
      { appId: appData._id, url: configuration.carddavUrl, username },
      "Successfully got configuration",
    );

    return {
      data: configuration,
    } satisfies CarddavRequestGetConfigurationActionResponse;
  }

  private async installApp(appData: ConnectedAppData) {
    const logger = this.loggerFactory("installApp");

    if (appData?.data?.password) {
      return {
        status: "connected",
        statusText:
          "app_carddav_admin.statusText.successfullySetUp" satisfies CarddavAdminAllKeys,
      };
    }

    const password = generatePassword();
    const encryptedPassword = encrypt(password);
    const status: ConnectedAppStatusWithText<
      CarddavAdminNamespace,
      CarddavAdminKeys
    > = {
      status: "connected",
      statusText:
        "app_carddav_admin.statusText.successfullySetUp" satisfies CarddavAdminAllKeys,
    };

    const username = await this.getUsername(appData);
    const carddavUrl = generateCarddavUrl(appData.organizationId, appData._id);
    await this.props.update({
      account: {
        username,
        serverUrl: carddavUrl,
      },
      data: {
        password: encryptedPassword,
      },
      ...status,
    });

    logger.info(
      {
        appId: appData._id,
        username,
        url: carddavUrl,
        status: status.status,
      },
      "Successfully connected to CalDAV calendar",
    );

    return {
      ...status,
      data: {
        carddavUrl,
        username,
        password,
      },
    } satisfies CarddavRequestInstallActionResponse;
  }

  /**
   * Main entry - old behavior preserved but improved
   * slug: array of path pieces after /api/apps/{organizationId}/{appId}/
   */
  public async processAppExternalCall(
    appData: ConnectedAppData,
    slug: string[],
    request: Request,
  ): Promise<Response | undefined> {
    const logger = this.loggerFactory("processAppExternalCall");
    const method = request.method.toUpperCase();
    const path = slug.join("/"); // might be "" for root
    logger.debug(
      { appId: appData._id, method, path },
      "Processing CardDAV external request",
    );

    // Validate auth
    const config = await this.getConfiguration(appData);
    if (!validateAuth(request, config?.data)) {
      logger.warn(
        { appId: appData._id, method, path },
        "Authentication failed",
      );
      return new Response("Unauthorized", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="CardDAV"' },
      });
    }

    // Common response headers
    const commonHeaders = {
      DAV: "1, 2, 3, addressbook",
      Allow: "OPTIONS, PROPFIND, GET, REPORT",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS, PROPFIND, GET, REPORT",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, Depth",
    };

    // OPTIONS
    if (method === "OPTIONS") {
      return new Response(null, { status: 200, headers: commonHeaders });
    }

    // PROPFIND
    if (method === "PROPFIND") {
      const resp = await this.handlePropfind(appData, path, request);
      // make sure common headers are present
      Object.entries(commonHeaders).forEach(([key, value]) => {
        resp.headers.set(key, value);
      });

      return resp;
    }

    // GET
    if (method === "GET") {
      const resp = await this.handleGet(appData, path, request);
      if (resp) {
        Object.entries(commonHeaders).forEach(([key, value]) => {
          resp.headers.set(key, value);
        });
      }
      return resp;
    }

    // REPORT
    if (method === "REPORT") {
      const resp = await this.handleReport(appData, path, request);
      Object.entries(commonHeaders).forEach(([key, value]) => {
        resp.headers.set(key, value);
      });

      return resp;
    }

    logger.warn({ appId: appData._id, method, path }, "Unsupported method");
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: commonHeaders.Allow },
    });
  }

  /**
   * PROPFIND handler - respects Depth: 0 or 1 and returns properly namespaced XML
   */
  private async handlePropfind(
    appData: ConnectedAppData,
    path: string,
    request: Request,
  ): Promise<Response> {
    const logger = this.loggerFactory("handlePropfind");
    logger.debug({ appId: appData._id, path }, "Handling PROPFIND request");

    const basePath = `/api/apps/${appData.organizationId}/${appData._id}`;
    const depth = (request.headers.get("depth") || "0").toLowerCase(); // "0" or "1" (string)
    const depthIs0 = depth === "0";

    // Helper to wrap xml with required namespaces and use D: and C: prefixes
    const wrap = (inner: string) =>
      `<?xml version="1.0" encoding="UTF-8"?>
<D:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
${inner}
</D:multistatus>`;

    // ROOT (e.g., /api/apps/{organizationId}/{appId}/)
    if (path === "") {
      // At Depth:0 return only the resource's props.
      // At Depth:1 include a child entry for addressbooks/ (discovery)
      const rootHref = `${basePath}/`; // must end with slash for collection
      const addressbooksHref = `${basePath}/addressbook/`; // must end with slash
      let inner = `
  <D:response>
    <D:href>${rootHref}</D:href>
   <D:propstat>
      <D:prop>
        <D:resourcetype>
          <D:collection/>
        </D:resourcetype>
        <D:displayname>CardDAV Root</D:displayname>
        <D:current-user-principal>
          <D:href>${basePath}/principal/</D:href>
        </D:current-user-principal>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;

      if (!depthIs0) {
        // include a separate response for addressbooks home (discovery)
        inner += `
  <D:response>
    <D:href>${addressbooksHref}</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype><D:collection/></D:resourcetype>
        <D:displayname>Addressbooks</D:displayname>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;
      }

      return new Response(wrap(inner), {
        status: 207,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    // PRINCIPAL
    if (path === "principal") {
      const principalHref = `${basePath}/principal/`;
      const addressbooksHref = `${basePath}/addressbook/`;
      const inner = `
  <D:response>
    <D:href>${principalHref}</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype>
          <D:principal/>
        </D:resourcetype>

        <D:displayname>Organization Principal</D:displayname>

        <D:principal-URL>
          <D:href>${basePath}/principal/</D:href>
        </D:principal-URL>

        <D:current-user-principal>
          <D:href>${basePath}/principal/</D:href>
        </D:current-user-principal>

        <C:addressbook-home-set>
          <D:href>${basePath}/addressbook/</D:href>
        </C:addressbook-home-set>

      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;
      return new Response(wrap(inner), {
        status: 207,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    // ADDRESSBOOK HOME (lists addressbooks)
    if (path === "addressbook") {
      const customersHref = `${basePath}/addressbook/customers/`;
      const inner = `
  <D:response>
    <D:href>${customersHref}</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype><D:collection/><C:addressbook/></D:resourcetype>
        <D:displayname>Customers</D:displayname>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;
      return new Response(wrap(inner), {
        status: 207,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    // ADDRESSBOOK COLLECTION => list members when Depth:1 or return collection props at Depth:0
    if (path === "addressbook/customers") {
      // fetch customers list
      const customers = await this.props.services.customersService.getCustomers(
        { limit: 1000, offset: 0 },
      );
      const collectionHref = `${basePath}/addressbook/customers/`;
      let inner = `
  <D:response>
    <D:href>${collectionHref}</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype><D:collection/><C:addressbook/></D:resourcetype>
        <D:displayname>Customers</D:displayname>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;

      if (!depthIs0) {
        for (const cust of customers.items) {
          const href = `${basePath}/addressbook/customers/${cust._id}.vcf`;
          inner += `
  <D:response>
    <D:href>${href}</D:href>
    <D:propstat>
      <D:prop>
        <D:getetag>"${cust._id}"</D:getetag>
        <D:getcontenttype>text/vcard; charset=utf-8</D:getcontenttype>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;
        }
      }

      return new Response(wrap(inner), {
        status: 207,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    // Specific contact PROPFIND (props only)
    if (path.startsWith("addressbook/customers/")) {
      // normalize and extract id
      const suffix = path.replace(/^addressbook\/customers\//, "");
      const contactId = suffix.replace(/^\/*/, "").replace(/\.vcf$/, "");
      if (!contactId) return new Response("Not Found", { status: 404 });

      const customer =
        await this.props.services.customersService.getCustomer(contactId);
      if (!customer) return new Response("Not Found", { status: 404 });

      const href = `${basePath}/addressbook/customers/${customer._id}.vcf`;
      const inner = `
  <D:response>
    <D:href>${href}</D:href>
    <D:propstat>
      <D:prop>
        <D:getetag>"${customer._id}"</D:getetag>
        <D:getcontenttype>text/vcard; charset=utf-8</D:getcontenttype>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;

      return new Response(wrap(inner), {
        status: 207,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    return new Response("Not Found", { status: 404 });
  }

  /**
   * GET handler - returns vCard and proper headers (Content-Type & ETag).
   */
  private async handleGet(
    appData: ConnectedAppData,
    path: string,
    request: Request,
  ): Promise<Response> {
    const logger = this.loggerFactory("handleGet");
    logger.debug({ appId: appData._id, path }, "Handling GET request");

    // Expect path like: addressbook/customers/{id}.vcf
    if (!path.startsWith("addressbook/customers/")) {
      return new Response("Not Found", { status: 404 });
    }

    const suffix = path.replace(/^addressbook\/customers\//, "");
    const contactId = suffix.replace(/^\/*/, "").replace(/\.vcf$/, "");
    if (!contactId) return new Response("Not Found", { status: 404 });

    const customer =
      await this.props.services.customersService.getCustomer(contactId);
    if (!customer) return new Response("Not Found", { status: 404 });

    const vcard = customerToVCard(customer);
    const etag = customer._id; // simple etag; replace with computeETag(vcard) if you prefer content-based

    logger.debug(
      { appId: appData._id, contactId, customerName: customer.name },
      "Returning vCard",
    );

    return new Response(vcard, {
      status: 200,
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        ETag: `"${etag}"`,
      },
    });
  }

  /**
   * REPORT handler - supports addressbook-multiget and addressbook-query (simple mode)
   */
  private async handleReport(
    appData: ConnectedAppData,
    path: string,
    request: Request,
  ): Promise<Response> {
    const logger = this.loggerFactory("handleReport");
    logger.debug({ appId: appData._id, path }, "Handling REPORT request");

    const basePath = `/api/apps/${appData.organizationId}/${appData._id}`;

    // Only support REPORT on the customers collection
    if (path !== "addressbook/customers") {
      return new Response("Not Found", { status: 404 });
    }

    const bodyText = await request.text().catch(() => "");
    // Basic detection: addressbook-multiget vs addressbook-query
    const isMultiget = /<\s*addressbook-multiget[\s>]/i.test(bodyText);
    const isQuery = /<\s*addressbook-query[\s>]/i.test(bodyText);

    // fetch all customers for query fallback
    const customers =
      await this.props.services.customersService.getAllCustomers();

    // XML wrapper using D: and C: prefixes
    const wrap = (inner: string) =>
      `<?xml version="1.0" encoding="UTF-8"?>
<D:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
${inner}
</D:multistatus>`;

    let inner = "";

    if (isMultiget) {
      // parse <D:href> or <href> from the body and return only requested vCards as <address-data>
      const hrefs: string[] = [];
      const hrefRegex = /<\s*(?:D:)?href\s*>([^<]+)<\s*\/\s*(?:D:)?href\s*>/gi;
      let m: RegExpExecArray | null;
      while ((m = hrefRegex.exec(bodyText))) {
        hrefs.push(m[1]);
      }

      // normalize hrefs to contact ids
      for (const h of hrefs) {
        // href may be absolute or relative. Extract last segment and remove .vcf
        const last = h.split("/").filter(Boolean).pop() || "";
        const id = last.replace(/\.vcf$/, "");
        const customer =
          await this.props.services.customersService.getCustomer(id);
        if (!customer) continue;
        const vcard = customerToVCard(customer);
        inner += `
  <D:response>
    <D:href>${basePath}/addressbook/customers/${customer._id}.vcf</D:href>
    <D:propstat>
      <D:prop>
        <D:getetag>"${customer._id}"</D:getetag>
        <C:address-data>${escapeXml(vcard)}</C:address-data>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;
      }

      return new Response(wrap(inner), {
        status: 207,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    // For simplicity we return address-data for all contacts (clients often request all)
    for (const customer of customers) {
      const vcard = customerToVCard(customer);
      inner += `
  <D:response>
    <D:href>${basePath}/addressbook/customers/${customer._id}.vcf</D:href>
    <D:propstat>
      <D:prop>
        <D:getetag>"${customer._id}"</D:getetag>
        <C:address-data>${escapeXml(vcard)}</C:address-data>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`;
    }

    return new Response(wrap(inner), {
      status: 207,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
}

/* small helper to XML-escape address-data content */
function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
