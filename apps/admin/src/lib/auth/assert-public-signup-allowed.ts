import { hasPendingInvitationForEmail } from "@/lib/auth/pending-invitation";
import {
  getSignupEmailBlockReason,
  isSignupEmailBlockingEnabled,
} from "@/lib/auth/signup-email";
import {
  isPublicSignupAllowedFromHeaders,
  isSignupGeoBlockingEnabled,
} from "@/lib/auth/signup-geo";
import { getLoggerFactory } from "@hacado/logger";
import { APIError } from "better-auth/api";

export async function assertPublicSignupAllowed({
  email,
  headers,
  logContext,
}: {
  email: string;
  headers: Headers;
  logContext: string;
}): Promise<void> {
  const emailLogger = getLoggerFactory("SignupEmail")(logContext);
  const geoLogger = getLoggerFactory("SignupGeo")(logContext);

  emailLogger.debug({ email }, "Public signup validation");

  if (email && (await hasPendingInvitationForEmail(email))) {
    emailLogger.info(
      { email },
      "Signup allowed: pending invitation for email, skipping email and region checks",
    );
    return;
  }

  if (isSignupEmailBlockingEnabled()) {
    const reason = getSignupEmailBlockReason(email);
    if (reason) {
      emailLogger.warn(
        { email, reason },
        "Signup rejected: SIGNUP_EMAIL_BLOCKED",
      );
      throw new APIError("FORBIDDEN", {
        message: "We cannot accept this email address",
        code: "SIGNUP_EMAIL_BLOCKED",
      });
    }
  }

  if (!isSignupGeoBlockingEnabled()) {
    geoLogger.debug("Signup geo blocking disabled");
    return;
  }

  const allowed = isPublicSignupAllowedFromHeaders(headers, logContext);
  if (!allowed) {
    geoLogger.warn({ email }, "Signup rejected: SIGNUP_REGION_BLOCKED");
    throw new APIError("FORBIDDEN", {
      message: "Sign-up is not available in your region",
      code: "SIGNUP_REGION_BLOCKED",
    });
  }
}
