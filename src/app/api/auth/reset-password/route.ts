import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isValidEmail, normalizeEmail } from "@/lib/auth-validation";
import { resetIdentifier } from "@/lib/auth-tokens";

const SALT_ROUNDS = 12;

type ResetBody = {
  token?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export async function POST(request: Request) {
  let body: ResetBody;

  try {
    body = (await request.json()) as ResetBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const token = body.token?.trim() ?? "";
  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";
  const confirmPassword = body.confirmPassword ?? "";

  if (!token || !email) {
    return Response.json(
      { error: "Invalid or missing reset link." },
      { status: 400 },
    );
  }

  if (!isValidEmail(email)) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  if (password !== confirmPassword) {
    return Response.json({ error: "Passwords do not match." }, { status: 400 });
  }

  const identifier = resetIdentifier(email);
  const record = await prisma.verificationToken.findFirst({
    where: { identifier, token },
  });

  if (!record) {
    return Response.json(
      { error: "This reset link is invalid or has already been used." },
      { status: 400 },
    );
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: { identifier, token },
      },
    });
    return Response.json(
      { error: "This reset link has expired. Please request a new one." },
      { status: 400 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      // Completing a reset proves the user controls this inbox, so also mark
      // the email verified — otherwise login (which requires a verified email)
      // would keep rejecting them with a generic "invalid" message.
      data: { password: hashedPassword, emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: { identifier, token },
      },
    }),
  ]);

  return Response.json({
    success: true,
    message: "Password updated successfully",
  });
}
