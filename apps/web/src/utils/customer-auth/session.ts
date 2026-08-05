import { CUSTOMER_SESSION_COOKIE, CustomerSession } from "@hacado/types";
import { cookies } from "next/headers";
import { getServicesContainer } from "../utils";

export async function getCustomerSessionFromRequest(): Promise<CustomerSession | null> {
  const sessionToken = (await cookies()).get(CUSTOMER_SESSION_COOKIE)?.value;
  const servicesContainer = await getServicesContainer();
  return servicesContainer.customerAuthService.authorizeSession(sessionToken);
}

export async function requireCustomerSession(): Promise<CustomerSession> {
  const session = await getCustomerSessionFromRequest();
  if (!session) {
    throw new CustomerSessionRequiredError();
  }
  return session;
}

export class CustomerSessionRequiredError extends Error {
  constructor() {
    super("unauthorized");
  }
}
