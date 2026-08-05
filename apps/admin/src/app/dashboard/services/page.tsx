import { getLoggerFactory } from "@hacado/logger";
import { redirect } from "next/navigation";

export default async function ServicesPage() {
  const logger = getLoggerFactory("AdminPages")("services");

  logger.debug("Redirecting to services options page");
  redirect("/dashboard/services/options");
}
