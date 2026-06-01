import { auth } from "@/lib/auth";
import { getAutomations, resolveClientId } from "@/lib/clients";
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

  const automations = await getAutomations(clientId);
  return NextResponse.json(automations);
}
