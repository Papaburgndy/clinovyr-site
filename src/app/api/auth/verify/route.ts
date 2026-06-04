import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/auth-validation";

type VerifyBody = {
  token?: string;
  email?: string;
};

export async function POST(request: Request) {
  let body: VerifyBody;

  try {
    body = (await request.json()) as VerifyBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const token = body.token?.trim() ?? "";
  const email = normalizeEmail(body.email ?? "");

  if (!token || !email) {
    return Response.json(
      { error: "Invalid or missing verification link." },
      { status: 400 },
    );
  }

  const record = await prisma.verificationToken.findFirst({
    where: { identifier: email, token },
  });

  if (!record) {
    return Response.json(
      { error: "This verification link is invalid or has already been used." },
      { status: 400 },
    );
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: { identifier: email, token },
      },
    });
    return Response.json(
      { error: "This verification link has expired. Please request a new one." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return Response.json({ error: "Account not found." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: { identifier: email, token },
      },
    }),
  ]);

  return Response.json({
    success: true,
    message: "Email verified successfully",
  });
}
