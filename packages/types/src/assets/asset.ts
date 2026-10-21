import * as z from "zod";
import { AppointmentEntity } from "../booking/appointment";
import { Customer } from "../customers/customer";
import { WithDatabaseId, WithOrganizationId } from "../database";
import { Prettify, zObjectId } from "../utils";
import { AssetEntity } from "./entity";

export type Asset = Prettify<
  WithOrganizationId<
    WithDatabaseId<
      AssetEntity & {
        appointment?: AppointmentEntity & {
          customer?: Customer;
        };
        customer?: Customer;
      }
    >
  >
>;

export const assetUpdateSchema = z.object({
  description: z
    .string()
    .max(1024, "validation.assets.descriptionMaxLength")
    .optional(),
  appointmentId: zObjectId().optional(),
  customerId: zObjectId().optional(),
});

export type AssetUpdate = z.infer<typeof assetUpdateSchema>;

export type UploadedFile = Asset & {
  url: string;
  source: "assets" | "third-party";
};
