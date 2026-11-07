import { getVapidPublicKey } from "@hacado/services/push-notifications";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json(
      { error: "Push notifications are not configured" },
      { status: 503 },
    );
  }

  return NextResponse.json({ publicKey });
}
