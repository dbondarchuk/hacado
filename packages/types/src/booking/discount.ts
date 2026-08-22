import * as z from "zod";
import { WithDatabaseId, WithOrganizationId } from "../database";
import {
  asOptinalNumberField,
  zNonEmptyString,
  zObjectId,
  zUniqueArray,
} from "../utils";
import { Prettify } from "../utils/helpers";

export const fixedAmountDiscountType = "amount";
export const percentageDiscountType = "percentage";

export const discountTypes = [
  fixedAmountDiscountType,
  percentageDiscountType,
] as const;

export const discountSchema = z
  .object({
    name: zNonEmptyString(
      "validation.discount.name.required",
      2,
      256,
      "validation.discount.name.max",
    ),
    enabled: z.coerce.boolean<boolean>(),
    startDate: z.coerce.date<Date>().optional(),
    endDate: z.coerce.date<Date>().optional(),
    appointmentStartDate: z.coerce.date<Date>().optional(),
    appointmentEndDate: z.coerce.date<Date>().optional(),
    maxUsage: asOptinalNumberField(
      z.coerce
        .number<number>({ error: "validation.discount.maxUsage.min" })
        .int("validation.discount.maxUsage.min")
        .min(1, "validation.discount.maxUsage.min"),
    ),
    maxUsagePerCustomer: asOptinalNumberField(
      z.coerce
        .number<number>({
          error: "validation.discount.maxUsagePerCustomer.min",
        })
        .int("validation.discount.maxUsagePerCustomer.min")
        .min(1, "validation.discount.maxUsagePerCustomer.min"),
    ),
    type: z.enum(discountTypes),
    limitTo: z
      .array(
        z.object({
          addons: z
            .array(
              z.object({
                ids: zUniqueArray(
                  z.array(
                    z.object({
                      id: zObjectId(
                        "validation.discount.limitTo.addons.required",
                      ),
                    }),
                  ),
                  // .min(1, "discount.limitTo.addons.min"),
                  (addon) => addon.id,
                  "validation.discount.limitTo.addons.unique",
                ),
              }),
            )
            .optional(),
          options: zUniqueArray(
            z.array(
              z.object({
                id: zObjectId("validation.discount.limitTo.options.required"),
              }),
            ),
            (option) => option.id,
            "validation.discount.limitTo.options.unique",
          ).optional(),
          packages: zUniqueArray(
            z.array(
              z.object({
                id: zObjectId("validation.discount.limitTo.packages.required"),
              }),
            ),
            (pkg) => pkg.id,
            "validation.discount.limitTo.packages.unique",
          ).optional(),
        }),
      )
      .optional(),
    value: z.coerce
      .number<number>({ error: "validation.discount.value.required" })
      .int("validation.discount.value.required"),
    codes: zUniqueArray(
      z
        .array(
          zNonEmptyString(
            "validation.discount.codes.minLength",
            3,
            256,
            "validation.discount.codes.maxLength",
          ),
        )
        .min(1, "validation.discount.codes.min")
        .max(10, "validation.discount.codes.max"),
      (code) => code,
      "validation.discount.codes.unique",
    ),
  })
  .superRefine((arg, ctx) => {
    if (arg.startDate && arg.endDate && arg.endDate < arg.startDate) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "discount.endDate.min",
      });
    }
    if (arg.type === "percentage" && arg.value > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "discount.value.max",
      });
    }
  });

export type DiscountUpdateModel = z.infer<typeof discountSchema>;
export type Discount = Prettify<
  WithOrganizationId<
    WithDatabaseId<DiscountUpdateModel> & {
      updatedAt: Date;
    }
  >
>;

export type DiscountType = Discount["type"];

export const getDiscountSchemaWithUniqueCheck = (
  uniqueNameAndCodeCheckFn: (
    name: string,
    codes: string[],
  ) => Promise<{
    name: boolean;
    code: Record<string, boolean>;
  }>,
  nameMessage: string,
  codeMessage: string,
) => {
  return discountSchema.superRefine(async (arg, ctx) => {
    const isUnique = await uniqueNameAndCodeCheckFn(arg.name, arg.codes);

    if (!isUnique.name) {
      ctx.addIssue({
        code: "custom",
        path: ["name"],
        message: nameMessage,
      });
    }

    for (const [code, valid] of Object.entries(isUnique.code)) {
      const index = arg.codes.indexOf(code);
      if (valid || index < 0) continue;

      ctx.addIssue({
        code: "custom",
        path: [`codes.${index}`],
        message: codeMessage,
      });
    }
  });
};

export const applyDiscountRequestSchema = z
  .object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    optionId: zObjectId(
      "validation.discount.applyRequest.optionId.required",
    ).optional(),
    packageId: zObjectId(
      "validation.discount.applyRequest.packageId.required",
    ).optional(),
    dateTime: z.coerce.date<Date>({
      error: "validation.discount.applyRequest.dateTime.required",
    }),
    addons: zUniqueArray(
      z.array(zObjectId("validation.discount.applyRequest.addons.required")),
      (id) => id,
      "validation.discount.applyRequest.addons.unique",
    ).optional(),
    code: zNonEmptyString("discount.applyRequest.code.required"),
  })
  .superRefine((arg, ctx) => {
    if (!arg.packageId && !arg.optionId) {
      ctx.addIssue({
        code: "custom",
        path: ["optionId"],
        message: "validation.discount.applyRequest.optionId.required",
      });
    }
  });

export type ApplyDiscountRequest = z.infer<typeof applyDiscountRequestSchema>;
export type ApplyCustomerDiscountRequest = Prettify<
  Omit<ApplyDiscountRequest, "name" | "email" | "phone"> & {
    customerId?: string;
  }
>;

export type ApplyDiscountResponse = {
  code: string;
  value: number;
  type: DiscountType;
};
