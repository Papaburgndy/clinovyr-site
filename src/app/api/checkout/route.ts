import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth-helpers";
import { createCheckoutSession } from "@/lib/checkout-create";

/**
 * Legacy checkout endpoint — delegates to shared checkout session logic.
 * Prefer POST /api/checkout/create for new integrations.
 */
export async function POST() {
  const { userId, session } = await requireAuthApi();

  if (!userId || !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await createCheckoutSession(userId, session);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ url: result.url });
  } catch (error) {
    console.error("[checkout]", error);
    return NextResponse.json(
      { error: "Checkout unavailable." },
      { status: 500 },
    );
  }
}
