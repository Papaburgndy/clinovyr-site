import { NextResponse } from "next/server";
import { getIndustryBySlug } from "@/lib/industries";
import { getSiteUrl } from "@/lib/resend";
import { getPlaybookPriceCents, getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { industry?: string };
    const slug = body.industry;

    if (!slug) {
      return NextResponse.json(
        { error: "Industry is required." },
        { status: 400 },
      );
    }

    const config = getIndustryBySlug(slug);
    if (!config) {
      return NextResponse.json(
        { error: "Unknown industry." },
        { status: 400 },
      );
    }

    const stripe = getStripe();
    const siteUrl = getSiteUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: getPlaybookPriceCents(),
            product_data: {
              name: `AI Implementation Playbook — ${config.label}`,
              description: `Complete ${config.label} AI playbook PDF from Clinovyr`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        industry: config.slug,
        version: "1",
      },
      success_url: `${siteUrl}/playbooks/success?session_id={CHECKOUT_SESSION_ID}&industry=${config.slug}`,
      cancel_url: `${siteUrl}/playbooks/${config.slug}`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[playbook-checkout]", error);
    return NextResponse.json(
      { error: "Checkout unavailable." },
      { status: 500 },
    );
  }
}
