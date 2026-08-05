import { getUser } from "@/app/utils";
import type {
  RequiredPermission,
  TeamPermissionAction,
  TeamPermissionResource,
} from "@hacado/types";
import { hasPermission, meetsRequiredPermission } from "@hacado/utils";
import { forbidden } from "next/navigation";

/** Throw Next.js `forbidden()` (403) when the user lacks `required`. */
export async function assertPagePermission(
  required?: RequiredPermission,
): Promise<void> {
  if (!required) return;
  const user = await getUser();
  if (!meetsRequiredPermission(user, required)) {
    forbidden();
  }
}

/** Throw Next.js `forbidden()` (403) when the user lacks resource/action. */
export async function assertPageHasPermission<
  R extends TeamPermissionResource,
>(resource: R, action: TeamPermissionAction<R>): Promise<void> {
  const user = await getUser();
  if (!hasPermission(user, resource, action)) {
    forbidden();
  }
}
