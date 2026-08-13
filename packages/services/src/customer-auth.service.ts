import { renderToStaticMarkup } from "@hacado/email-builder/static";
import { BaseAllKeys } from "@hacado/i18n";
import type {
  CustomerAuthConfiguration,
  CustomerSession,
  CustomerSessionPayload,
  ICustomerAuthService,
  IServicesContainer,
  RequestOtpPayload,
  RequestOtpResult,
  VerifyOtpPayload,
  VerifyOtpResult,
} from "@hacado/types";
import {
  CUSTOMER_OTP_MAX_REQUESTS,
  CUSTOMER_OTP_RESEND_COOLDOWN_SECONDS,
  CUSTOMER_OTP_TTL_SECONDS,
  CUSTOMER_SESSION_COOKIE,
  CUSTOMER_SESSION_TTL_SECONDS,
  CustomerAuthError,
} from "@hacado/types";
import {
  getAdminUrl,
  getArguments,
  getWebsiteUrl,
  templateSafeWithError,
} from "@hacado/utils";
import { createHmac, randomInt, randomUUID } from "node:crypto";
import { BaseService } from "./services/base.service";

// Re-export for consumers
export {
  CUSTOMER_SESSION_COOKIE,
  CustomerAuthError,
  type RequestOtpResult,
  type VerifyOtpResult,
} from "@hacado/types";

type OtpState = {
  customerId: string;
  channel: "email" | "phone";
  destination: string;
  code: string;
};

export class CustomerAuthService
  extends BaseService
  implements ICustomerAuthService
{
  public constructor(
    organizationId: string,
    private readonly services: Pick<
      IServicesContainer,
      | "configurationService"
      | "customersService"
      | "notificationService"
      | "organizationService"
      | "redisClient"
      | "templatesService"
    >,
  ) {
    super("CustomerAuthService", organizationId);
  }

  public async getAuthOptions() {
    const logger = this.loggerFactory("getAuthOptions");
    logger.debug({}, "Loading customer auth options");

    const config = await this.getCustomerAuthConfig();
    const options = { allowPhoneOtp: config.allowPhoneOtp ?? false };

    logger.debug(
      { allowPhoneOtp: options.allowPhoneOtp },
      "Customer auth options loaded",
    );
    return options;
  }

  public async requestOtp(
    payload: RequestOtpPayload,
    ip: string,
  ): Promise<RequestOtpResult> {
    const logger = this.loggerFactory("requestOtp");
    const email = payload.email?.trim().toLowerCase();
    const phone = payload.phone?.trim();
    const channel = email ? "email" : phone ? "phone" : null;

    logger.debug({ channel, ip }, "OTP request received");

    if (!channel) {
      logger.warn({ ip }, "OTP request missing email and phone");
      throw new CustomerAuthError("email_or_phone_required", 400);
    }

    const destination = channel === "email" ? email! : phone!;
    const rateAllowed = await this.consumeRateLimit(
      `${ip}:${destination}`,
      "otp-request",
      CUSTOMER_OTP_MAX_REQUESTS,
      CUSTOMER_OTP_RESEND_COOLDOWN_SECONDS,
    );

    if (!rateAllowed) {
      logger.warn({ channel, ip }, "OTP request rate limit exceeded");
      throw new CustomerAuthError("too_many_requests", 429);
    }

    const customer =
      await this.services.customersService.findCustomerBySearchField(
        destination,
        channel,
      );

    const genericResponse = (): RequestOtpResult => ({
      success: true,
      otpExpiresAt: Date.now() + CUSTOMER_OTP_TTL_SECONDS * 1000,
      resendAfter: Date.now() + CUSTOMER_OTP_RESEND_COOLDOWN_SECONDS * 1000,
    });

    if (!customer) {
      logger.info(
        { channel, destination },
        "OTP request completed with generic response (customer not found)",
      );
      return genericResponse();
    }

    logger.debug(
      { customerId: customer._id, channel },
      "Customer found, preparing OTP delivery",
    );

    const config = await this.getCustomerAuthConfig();
    const code = randomInt(100000, 999999).toString();
    const otpState: OtpState = {
      customerId: customer._id,
      channel,
      destination,
      code,
    };

    await this.services.redisClient.set(
      this.getOtpKey(destination, channel),
      JSON.stringify(otpState),
      "EX",
      CUSTOMER_OTP_TTL_SECONDS,
    );

    logger.debug(
      {
        customerId: customer._id,
        channel,
        ttlSeconds: CUSTOMER_OTP_TTL_SECONDS,
      },
      "OTP stored in Redis",
    );

    const organization =
      await this.services.organizationService.getOrganization();
    if (!organization) {
      logger.error(
        { customerId: customer._id },
        "Organization not found for OTP",
      );
      throw new CustomerAuthError("organization_not_found", 404);
    }

    const [bookingConfig, generalConfig, brandConfig, socialConfig] =
      await Promise.all([
        this.services.configurationService.getConfiguration("booking"),
        this.services.configurationService.getConfiguration("general"),
        this.services.configurationService.getConfiguration("brand"),
        this.services.configurationService.getConfiguration("social"),
      ]);

    const args = getArguments({
      customer,
      config: {
        booking: bookingConfig,
        general: generalConfig,
        brand: brandConfig,
        social: socialConfig,
      },
      adminUrl: getAdminUrl(),
      websiteUrl: getWebsiteUrl(organization),
      additionalProperties: { otp: code },
    });

    if (channel === "email") {
      await this.sendOtpEmail(email!, customer._id, config, args);
    } else if (channel === "phone") {
      if (!config.allowPhoneOtp) {
        logger.warn(
          { customerId: customer._id },
          "Phone OTP requested but not enabled in configuration",
        );
        throw new CustomerAuthError("phone_otp_not_enabled", 400);
      }
      await this.sendOtpText(phone!, customer._id, config, args);
    } else {
      logger.warn(
        { customerId: customer._id, channel },
        "Customer matched but has no destination for selected channel",
      );
    }

    logger.info({ customerId: customer._id, channel }, "OTP sent successfully");
    return genericResponse();
  }

  public async verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResult> {
    const logger = this.loggerFactory("verifyOtp");
    const email = payload.email?.trim().toLowerCase();
    const phone = payload.phone?.trim();
    const otp = payload.otp?.trim();
    const destination = email || phone;

    logger.debug(
      { channel: email ? "email" : phone ? "phone" : null, ip: payload.ip },
      "OTP verification attempt",
    );

    if (!destination || !otp) {
      logger.warn({ ip: payload.ip }, "OTP verify missing destination or code");
      throw new CustomerAuthError("invalid_payload", 400);
    }

    const channel = email ? "email" : "phone";
    const rateAllowed = await this.consumeRateLimit(
      `${payload.ip}:${destination}`,
      "otp-verify",
      10,
      5 * 60,
    );

    if (!rateAllowed) {
      logger.warn(
        { channel, ip: payload.ip },
        "OTP verify rate limit exceeded",
      );
      throw new CustomerAuthError("too_many_requests", 429);
    }

    const otpRaw = await this.services.redisClient.get(
      this.getOtpKey(destination, channel),
    );
    const row = otpRaw ? (JSON.parse(otpRaw) as OtpState) : null;

    if (!row || row.code !== otp) {
      logger.warn(
        { channel, hasStoredOtp: !!row },
        "OTP verification failed: invalid or expired code",
      );
      throw new CustomerAuthError("invalid_otp", 400);
    }

    await this.services.redisClient.del(this.getOtpKey(destination, channel));
    logger.debug(
      { customerId: row.customerId, channel },
      "OTP consumed and removed from Redis",
    );

    const sessionId = randomUUID();
    const token = this.createJwtToken({
      organizationId: this.organizationId,
      customerId: row.customerId,
      sessionId,
      exp: Math.floor(Date.now() / 1000) + CUSTOMER_SESSION_TTL_SECONDS,
    });

    await this.services.redisClient.set(
      this.getSessionKey(sessionId),
      row.customerId,
      "EX",
      CUSTOMER_SESSION_TTL_SECONDS,
    );

    const customer = await this.services.customersService.getCustomer(
      row.customerId,
    );

    logger.info(
      {
        customerId: row.customerId,
        sessionId,
        channel,
        ttlSeconds: CUSTOMER_SESSION_TTL_SECONDS,
      },
      "Customer session created after OTP verification",
    );

    return {
      success: true,
      name: customer?.name,
      email: customer?.email,
      phone: customer?.phone,
      id: customer?._id,
      token,
    };
  }

  public async authorizeSession(
    sessionToken?: string | null,
  ): Promise<CustomerSession | null> {
    const logger = this.loggerFactory("authorizeSession");

    if (!sessionToken) {
      logger.debug({}, "No customer session token present");
      return null;
    }

    const payload = this.verifyJwtToken(sessionToken);
    if (!payload || payload.organizationId !== this.organizationId) {
      logger.warn(
        {
          hasPayload: !!payload,
          payloadOrganizationId: payload?.organizationId,
        },
        "Customer session JWT invalid or organization mismatch",
      );
      return null;
    }

    const customerId = await this.services.redisClient.get(
      this.getSessionKey(payload.sessionId),
    );

    if (!customerId || customerId !== payload.customerId) {
      logger.warn(
        {
          sessionId: payload.sessionId,
          customerIdFromRedis: customerId,
          customerIdFromToken: payload.customerId,
        },
        "Customer session not found in Redis or customer mismatch",
      );
      return null;
    }

    logger.debug(
      { customerId: payload.customerId, sessionId: payload.sessionId },
      "Customer session authorized",
    );

    return {
      customerId: payload.customerId,
      sessionId: payload.sessionId,
      organizationId: payload.organizationId,
    };
  }

  public async logout(sessionToken?: string | null): Promise<void> {
    const logger = this.loggerFactory("logout");
    const payload = sessionToken ? this.verifyJwtToken(sessionToken) : null;

    if (payload?.sessionId && payload.organizationId === this.organizationId) {
      await this.services.redisClient.del(
        this.getSessionKey(payload.sessionId),
      );
      logger.info(
        { sessionId: payload.sessionId, customerId: payload.customerId },
        "Customer session revoked",
      );
      return;
    }

    logger.debug(
      { hasToken: !!sessionToken, hasPayload: !!payload },
      "Logout called with no active session",
    );
  }

  public getSessionCookieHeader(token: string): string {
    return `${CUSTOMER_SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${CUSTOMER_SESSION_TTL_SECONDS}`;
  }

  public getClearSessionCookieHeader(): string {
    return `${CUSTOMER_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  }

  private async getCustomerAuthConfig(): Promise<CustomerAuthConfiguration> {
    const logger = this.loggerFactory("getCustomerAuthConfig");
    const config =
      await this.services.configurationService.getConfiguration("customerAuth");

    logger.debug(
      {
        hasEmailTemplate: !!config.otpEmailTemplateId,
        allowPhoneOtp: config.allowPhoneOtp ?? false,
        hasTextTemplate: !!config.otpTextTemplateId,
      },
      "Customer auth configuration loaded",
    );

    return config;
  }

  private async sendOtpEmail(
    to: string,
    customerId: string,
    config: CustomerAuthConfiguration,
    args: ReturnType<typeof getArguments>,
  ) {
    const logger = this.loggerFactory("sendOtpEmail");
    const templateId = config.otpEmailTemplateId;

    if (!templateId) {
      logger.warn({ customerId }, "OTP email template not configured");
      return;
    }

    const template =
      await this.services.templatesService.getTemplate(templateId);
    if (!template || template.type !== "email") {
      logger.warn(
        { customerId, templateId, templateType: template?.type },
        "OTP email template missing or wrong type",
      );
      return;
    }

    logger.debug({ customerId, templateId }, "Rendering OTP email");

    const subject = templateSafeWithError(template.subject, args, true);
    const body = await renderToStaticMarkup({
      document: template.value,
      args,
    });

    await this.services.notificationService.sendEmail({
      email: { to, subject, body },
      handledBy:
        "admin.settings.customerAccess.handlers.otpRequest" satisfies BaseAllKeys,
      participantType: "customer",
      customerId,
    });

    logger.info({ customerId, templateId }, "OTP email queued for delivery");
  }

  private async sendOtpText(
    phone: string,
    customerId: string,
    config: CustomerAuthConfiguration,
    args: ReturnType<typeof getArguments>,
  ) {
    const logger = this.loggerFactory("sendOtpText");
    const templateId = config.otpTextTemplateId;

    if (!templateId) {
      logger.warn({ customerId }, "OTP text template not configured");
      return;
    }

    const template =
      await this.services.templatesService.getTemplate(templateId);
    if (!template || template.type !== "text-message") {
      logger.warn(
        { customerId, templateId, templateType: template?.type },
        "OTP text template missing or wrong type",
      );
      return;
    }

    logger.debug({ customerId, templateId }, "Sending OTP text message");

    await this.services.notificationService.sendTextMessage({
      phone,
      body: templateSafeWithError(template.value as string, args, true),
      handledBy:
        "admin.settings.customerAccess.handlers.otpRequest" satisfies BaseAllKeys,
      participantType: "customer",
      customerId,
    });

    logger.info(
      { customerId, templateId },
      "OTP text message queued for delivery",
    );
  }

  private async consumeRateLimit(
    key: string,
    bucket: string,
    max: number,
    ttlSeconds: number,
  ): Promise<boolean> {
    const logger = this.loggerFactory("consumeRateLimit");
    const rateLimitKey = `customer-auth:rate-limit:${this.organizationId}:${bucket}:${key}`;
    const count = await this.services.redisClient.incr(rateLimitKey);

    if (count === 1) {
      await this.services.redisClient.expire(rateLimitKey, ttlSeconds);
    }

    const allowed = count <= max;

    if (!allowed) {
      logger.warn({ bucket, count, max, ttlSeconds }, "Rate limit exceeded");
    } else {
      logger.debug({ bucket, count, max }, "Rate limit check passed");
    }

    return allowed;
  }

  private createJwtToken(payload: CustomerSessionPayload): string {
    const secret = process.env.AUTH_SECRET || "customer-auth-dev-secret";
    const header = { alg: "HS256", typ: "JWT" };
    const h = this.base64Url(JSON.stringify(header));
    const p = this.base64Url(JSON.stringify(payload));
    const signature = createHmac("sha256", secret)
      .update(`${h}.${p}`)
      .digest("base64url");
    return `${h}.${p}.${signature}`;
  }

  private verifyJwtToken(token: string): CustomerSessionPayload | null {
    const secret = process.env.AUTH_SECRET || "customer-auth-dev-secret";
    const [h, p, sig] = token.split(".");
    if (!h || !p || !sig) return null;

    const expected = createHmac("sha256", secret)
      .update(`${h}.${p}`)
      .digest("base64url");
    if (expected !== sig) return null;

    const payload = JSON.parse(
      Buffer.from(p, "base64url").toString("utf8"),
    ) as CustomerSessionPayload;

    if (
      !payload?.exp ||
      !payload?.sessionId ||
      !payload?.customerId ||
      !payload?.organizationId ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return payload;
  }

  private base64Url(value: string) {
    return Buffer.from(value, "utf8").toString("base64url");
  }

  private getOtpKey(destination: string, channel: "email" | "phone") {
    return `customer-auth:otp:${this.organizationId}:${channel}:${destination}`;
  }

  private getSessionKey(sessionId: string) {
    return `customer-auth:session:${this.organizationId}:${sessionId}`;
  }
}
