import { auth } from "@/lib/auth";
import {
  getClientConfig,
  resolveClientId,
  saveClientConfig,
} from "@/lib/clients";
import type { ClientConfig } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = await resolveClientId(
    session.user.email,
    searchParams.get("clientId")
  );

  if (!clientId) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const config = await getClientConfig(clientId);
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const clientId = await resolveClientId(
    session.user.email,
    body.clientId ?? null
  );

  if (!clientId) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const current = await getClientConfig(clientId);
  const updated: ClientConfig = {
    ...current,
    escalationEmail: body.escalationEmail ?? current.escalationEmail,
    businessHours: body.businessHours ?? current.businessHours,
    faq: body.faq ?? current.faq,
    notificationPreferences:
      body.notificationPreferences ?? current.notificationPreferences,
  };

  await saveClientConfig(clientId, updated);
  return NextResponse.json(updated);
}
