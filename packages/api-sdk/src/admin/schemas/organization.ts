import { z } from "zod";

export const organizationDomainSchema = z.object({
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/,
      {
        message: "configuration.brand.domain.invalid",
      },
    ),
});

export type OrganizationDomainInput = z.infer<typeof organizationDomainSchema>;
