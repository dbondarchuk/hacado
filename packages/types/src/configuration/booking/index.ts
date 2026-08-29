import * as z from "zod";
import { asOptinalNumberField, zNonEmptyString, zObjectId } from "../../utils";
import { appointmentCancellationRescheduleSchema } from "./cancellation";
import { paymentsConfigurationSchema } from "./payments";

export * from "../../booking/field";
export * from "./calendar-source";
export * from "./cancellation";
export * from "./payments";

export const customTimeSlotSchema = z
  .string({
    message: "validation.configuration.booking.customTimeSlot.required",
  })
  .refine((arg) => {
    const split = arg.split(":", 2).map((x) => parseInt(x));
    return !(
      isNaN(split[0]) ||
      split[0] < 0 ||
      split[0] >= 24 ||
      isNaN(split[1]) ||
      split[1] < 0 ||
      split[1] >= 60
    );
  }, "validation.configuration.booking.customTimeSlot.invalid");

export const slotStartSchema = z.union(
  [
    z.literal(5),
    z.literal(10),
    z.literal(15),
    z.literal(20),
    z.literal(30),
    z.literal("every-hour"), // every hour at start
    z.literal("custom"), // custom
  ],
  { message: "validation.configuration.booking.slotStart.unknown" },
);

export const allowPromoCodeType = [
  "never",
  "allow-if-has-active",
  "always",
] as const;

export type AllowPromoCodeType = (typeof allowPromoCodeType)[number];

export const bookingCatalogOptionSchema = z.object({
  type: z.literal("option"),
  id: z.string().min(1),
  optionId: zObjectId(
    "validation.configuration.booking.catalog.optionId.required",
  ),
});

export const bookingCatalogPackageSchema = z.object({
  type: z.literal("package"),
  id: z.string().min(1),
  packageId: zObjectId(
    "validation.configuration.booking.catalog.packageId.required",
  ),
});

export type BookingCatalogOption = z.infer<typeof bookingCatalogOptionSchema>;
export type BookingCatalogPackage = z.infer<typeof bookingCatalogPackageSchema>;
export type BookingCatalogGroup = {
  type: "group";
  id: string;
  name: string;
  description?: string;
  children: BookingCatalogNode[];
};
export type BookingCatalogNode =
  | BookingCatalogGroup
  | BookingCatalogOption
  | BookingCatalogPackage;

/** Ensures group nodes always have a `children` array (Mongo/legacy docs may omit it). */
export function normalizeCatalogNodes(
  nodes: BookingCatalogNode[] | undefined | null,
): BookingCatalogNode[] {
  if (!nodes?.length) return [];
  return nodes.map((node) => {
    if (node.type !== "group") return node;
    const description =
      node.description == null || node.description === ""
        ? undefined
        : node.description;
    return {
      type: "group" as const,
      id: node.id,
      name: node.name,
      ...(description !== undefined ? { description } : {}),
      children: normalizeCatalogNodes(node.children),
    };
  });
}

export const bookingCatalogNodeSchema: z.ZodType<BookingCatalogNode> = z.lazy(
  () =>
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("group"),
        id: z.string().min(1),
        name: zNonEmptyString(
          "validation.configuration.booking.catalog.groupName.required",
          1,
          256,
          "validation.configuration.booking.catalog.groupName.max",
        ),
        description: z.preprocess(
          (value) => (value == null || value === "" ? undefined : value),
          z
            .string()
            .max(
              1024,
              "validation.configuration.booking.catalog.groupDescription.max",
            )
            .optional(),
        ),
        children: z.preprocess(
          (value) => (value == null ? [] : value),
          z.array(bookingCatalogNodeSchema),
        ),
      }),
      bookingCatalogOptionSchema,
      bookingCatalogPackageSchema,
    ]),
);

export function catalogFromFlatOptions(
  options: { id: string }[] | undefined,
): BookingCatalogNode[] {
  return (options ?? []).map((option) => ({
    type: "option" as const,
    id: option.id,
    optionId: option.id,
  }));
}

export function flattenCatalogOptionIds(
  nodes: BookingCatalogNode[] | undefined,
): string[] {
  const ids: string[] = [];
  const walk = (list: BookingCatalogNode[]) => {
    for (const node of list) {
      if (node.type === "option" && node.optionId) ids.push(node.optionId);
      if (node.type === "group") walk(node.children ?? []);
    }
  };
  walk(nodes ?? []);
  return ids;
}

export function flattenCatalogPackageIds(
  nodes: BookingCatalogNode[] | undefined,
): string[] {
  const ids: string[] = [];
  const walk = (list: BookingCatalogNode[]) => {
    for (const node of list) {
      if (node.type === "package" && node.packageId) ids.push(node.packageId);
      if (node.type === "group") walk(node.children ?? []);
    }
  };
  walk(nodes ?? []);
  return ids;
}

export function catalogNodesAtPath(
  catalog: BookingCatalogNode[] | undefined,
  path: string[],
): { nodes: BookingCatalogNode[]; group?: BookingCatalogGroup } {
  let nodes = catalog ?? [];
  let group: BookingCatalogGroup | undefined;
  for (const id of path) {
    const next = nodes.find((node) => node.type === "group" && node.id === id);
    if (next?.type !== "group") break;
    group = next;
    nodes = next.children ?? [];
  }
  return { nodes, group };
}

/** Group ids to drill into so `optionId` is visible (empty if the option is at the root). */
export function catalogPathForOption(
  catalog: BookingCatalogNode[] | undefined,
  optionId: string,
): string[] | undefined {
  const walk = (
    nodes: BookingCatalogNode[],
    path: string[],
  ): string[] | undefined => {
    for (const node of nodes) {
      if (node.type === "option" && node.optionId === optionId) {
        return path;
      }
      if (node.type === "group") {
        const found = walk(node.children ?? [], [...path, node.id]);
        if (found) return found;
      }
    }
    return undefined;
  };
  return walk(catalog ?? [], []);
}

export function filterCatalogNodes(
  nodes: BookingCatalogNode[] | undefined,
  options?: {
    excludePackages?: boolean;
    optionIds?: Iterable<string>;
    packageIds?: Iterable<string>;
  },
): BookingCatalogNode[] {
  const optionIdSet = options?.optionIds
    ? new Set(options.optionIds)
    : undefined;
  const packageIdSet = options?.packageIds
    ? new Set(options.packageIds)
    : undefined;

  const walk = (list: BookingCatalogNode[]): BookingCatalogNode[] =>
    list.flatMap((node): BookingCatalogNode[] => {
      if (node.type === "group") {
        const children = walk(node.children ?? []);
        return children.length ? [{ ...node, children }] : [];
      }
      if (node.type === "package") {
        if (options?.excludePackages) return [];
        if (packageIdSet && !packageIdSet.has(node.packageId)) return [];
        return [node];
      }
      if (optionIdSet && !optionIdSet.has(node.optionId)) return [];
      return [node];
    });
  return walk(nodes ?? []);
}

export function catalogNodeIds(
  nodes: BookingCatalogNode[] | undefined,
): string[] {
  const ids: string[] = [];
  const walk = (list: BookingCatalogNode[]) => {
    for (const node of list) {
      ids.push(node.id);
      if (node.type === "group") walk(node.children ?? []);
    }
  };
  walk(nodes ?? []);
  return ids;
}

export function moveCatalogNode(
  catalog: BookingCatalogNode[],
  activeId: string,
  overId: string,
): BookingCatalogNode[] {
  if (activeId === overId) return catalog;

  const clone = (nodes: BookingCatalogNode[]): BookingCatalogNode[] =>
    nodes.map((node) =>
      node.type === "group"
        ? { ...node, children: clone(node.children ?? []) }
        : { ...node },
    );

  const next = clone(catalog);

  const locate = (
    nodes: BookingCatalogNode[],
    id: string,
  ): { list: BookingCatalogNode[]; index: number } | null => {
    const index = nodes.findIndex((node) => node.id === id);
    if (index >= 0) return { list: nodes, index };
    for (const node of nodes) {
      if (node.type === "group") {
        const found = locate(node.children ?? [], id);
        if (found) return found;
      }
    }
    return null;
  };

  const from = locate(next, activeId);
  const to = locate(next, overId);
  if (!from || !to) return catalog;

  const activeNode = from.list[from.index];

  if (activeNode.type === "group") {
    if (from.list !== to.list) return catalog;
    const [moved] = from.list.splice(from.index, 1);
    const overIndex = from.list.findIndex((node) => node.id === overId);
    if (overIndex < 0) return catalog;
    from.list.splice(overIndex, 0, moved);
    return next;
  }

  const [moved] = from.list.splice(from.index, 1);
  const overAfter = locate(next, overId);
  if (!overAfter) {
    from.list.splice(from.index, 0, moved);
    return catalog;
  }

  const overNode = overAfter.list[overAfter.index];
  if (overNode.type === "group") {
    overNode.children = overNode.children ?? [];
    overNode.children.push(moved);
    return next;
  }

  overAfter.list.splice(overAfter.index, 0, moved);
  return next;
}

export const generalBookingConfigurationSchema = z.object({
  maxWeeksInFuture: asOptinalNumberField(
    z.coerce
      .number<number>("configuration.booking.maxWeeksInFuture.integer")
      .int("configuration.booking.maxWeeksInFuture.integer")
      .min(2, "configuration.booking.maxWeeksInFuture.min")
      .max(20, "configuration.booking.maxWeeksInFuture.max"),
  ),
  minHoursBeforeBooking: asOptinalNumberField(
    z.coerce
      .number<number>("configuration.booking.minHoursBeforeBooking.integer")
      .int("configuration.booking.minHoursBeforeBooking.integer")
      .min(0, "configuration.booking.minHoursBeforeBooking.min")
      .max(72, "configuration.booking.minHoursBeforeBooking.max"),
  ),
  breakDuration: asOptinalNumberField(
    z.coerce
      .number<number>("configuration.booking.breakDuration.integer")
      .int("configuration.booking.breakDuration.integer")
      .min(0, "configuration.booking.breakDuration.min")
      .max(120, "configuration.booking.breakDuration.max"),
  ),
  slotStart: slotStartSchema.optional(),
  customSlotTimes: z.array(customTimeSlotSchema).optional(),
  scheduleAppId: z.string().optional(),
  availabilityProviderAppId: z.string().optional(),
  autoConfirm: z.coerce.boolean<boolean>().optional(),
  /** When true, staff may configure and use personal calendar sources. Studio plan only. */
  allowStaffCalendarSources: z.coerce.boolean<boolean>().optional(),
  allowPromoCode: z.enum(allowPromoCodeType),
  /** When true, public booking requires a verified customer OTP session. */
  requireCustomerOtp: z.coerce.boolean<boolean>().optional(),
  payments: paymentsConfigurationSchema,
  cancellationsAndReschedules: appointmentCancellationRescheduleSchema,
  catalog: z.preprocess(
    (value) => normalizeCatalogNodes(value as BookingCatalogNode[] | undefined),
    z.array(bookingCatalogNodeSchema),
  ),
});

export const bookingConfigurationSchema =
  generalBookingConfigurationSchema.superRefine((arg, ctx) => {
    if (arg.slotStart === "custom" && !arg.customSlotTimes?.length) {
      ctx.addIssue({
        path: ["customSlotTimes"],
        code: z.ZodIssueCode.custom,
        message: "validation.configuration.booking.customSlotTimes.required",
      });
    }

    const seenOptionIds = new Set<string>();
    const seenPackageIds = new Set<string>();
    let hasDuplicateLeaf = false;

    const walk = (nodes: BookingCatalogNode[], path: (string | number)[]) => {
      nodes.forEach((node, index) => {
        if (node.type === "option" && node.optionId) {
          if (seenOptionIds.has(node.optionId)) {
            hasDuplicateLeaf = true;
            ctx.addIssue({
              path: [...path, index, "optionId"],
              code: z.ZodIssueCode.custom,
              message:
                "validation.configuration.booking.catalog.optionId.unique",
            });
          } else {
            seenOptionIds.add(node.optionId);
          }
        }
        if (node.type === "package" && node.packageId) {
          if (seenPackageIds.has(node.packageId)) {
            hasDuplicateLeaf = true;
            ctx.addIssue({
              path: [...path, index, "packageId"],
              code: z.ZodIssueCode.custom,
              message:
                "validation.configuration.booking.catalog.packageId.unique",
            });
          } else {
            seenPackageIds.add(node.packageId);
          }
        }
        if (node.type === "group") {
          walk(node.children ?? [], [...path, index, "children"]);
        }
      });
    };

    walk(arg.catalog ?? [], ["catalog"]);
    if (hasDuplicateLeaf) {
      ctx.addIssue({
        path: ["catalog"],
        code: z.ZodIssueCode.custom,
        message: "validation.configuration.booking.catalog.unique",
      });
    }
  });

export type BookingConfiguration = z.infer<typeof bookingConfigurationSchema>;
