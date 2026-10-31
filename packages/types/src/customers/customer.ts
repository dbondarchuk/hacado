import * as z from "zod";
import { WithDatabaseId, WithOrganizationId } from "../database";
import {
  asOptionalField,
  zAssetName,
  zEmail,
  zNonEmptyString,
  zPhone,
  zUniqueArray,
} from "../utils";
import { Prettify } from "../utils/helpers";
export const isPaymentRequiredForCustomerTypes = [
  "inherit",
  "always",
  "never",
] as const;

const isPaymentRequiredForCustomerSchema = z.enum(
  isPaymentRequiredForCustomerTypes,
);

export const customerSchema = z
  .object({
    name: zNonEmptyString(
      "validation.customer.name.required",
      2,
      256,
      "validation.customer.name.max",
    ),
    email: zEmail,
    phone: zPhone,
    dateOfBirth: z.coerce.date<Date>().optional().nullable(),
    avatar: asOptionalField(zAssetName).nullable(),
    note: asOptionalField(
      z.string().max(4096, "validation.customer.note.max"),
    ).nullable(),
    knownNames: zUniqueArray(
      z.array(
        z
          .string()
          .min(1, "customer.name.required")
          .max(256, "customer.name.max"),
      ),
      (s) => s,
      "customer.knownNames.unique",
    ),
    knownEmails: zUniqueArray(
      z.array(zEmail),
      (s) => s,
      "customer.knownEmails.unique",
    ),
    knownPhones: zUniqueArray(
      z.array(zPhone),
      (s) => s,
      "customer.knownPhones.unique",
    ),
    dontAllowBookings: z.coerce.boolean<boolean>().optional().nullable(),
  })
  .and(
    z
      .object({
        requireDeposit: isPaymentRequiredForCustomerSchema.exclude(["always"], {
          error: "customer.requireDeposit.required",
        }),
      })
      .or(
        z.object({
          requireDeposit: isPaymentRequiredForCustomerSchema.extract(
            ["always"],
            {
              error: "customer.requireDeposit.required",
            },
          ),
          depositPercentage: z.coerce
            .number<number>({ error: "customer.depositPercentage.required" })
            .int("customer.depositPercentage.integer")
            .min(10, "customer.depositPercentage.min")
            .max(100, "customer.depositPercentage.max"),
        }),
      ),
  );

export const getCustomerSchemaWithUniqueCheck = (
  uniqueEmailOrPhoneCheckFn: (
    emails: string[],
    phone: string[],
  ) => Promise<{ email: boolean; phone: boolean }>,
  emailMessage: string,
  phoneMessage: string,
) => {
  return customerSchema.superRefine(async (args, ctx) => {
    if (!args.email && !args.phone) return;

    const isUnique = await uniqueEmailOrPhoneCheckFn(
      [args.email, ...(args.knownEmails || [])],
      [args.phone, ...(args.knownPhones || [])],
    );

    if (!isUnique.email) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: emailMessage,
      });
    }

    if (!isUnique.phone) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: phoneMessage,
      });
    }
  });
};

export type CustomerUpdateModel = z.infer<typeof customerSchema>;
export type Customer = Prettify<
  WithOrganizationId<WithDatabaseId<CustomerUpdateModel>> &
    (
      | {
          isDeleted?: false;
          deletedAt?: never;
        }
      | {
          isDeleted: true;
          deletedAt: Date;
        }
    )
>;
