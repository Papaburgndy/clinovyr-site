import { NextResponse } from "next/server";
import { requireAuthApi } from "@/lib/auth-helpers";
import { createCheckoutSession } from "@/lib/checkout-create";

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
    console.error("[checkout/create]", error);
    return NextResponse.json(
      { error: "Checkout unavailable." },
      { status: 500 },
    );
  }
}
