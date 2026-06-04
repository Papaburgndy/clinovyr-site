import { prisma } from "@/lib/prisma";
import {
  buildPasswordResetEmailHtml,
  getAppBaseUrl,
  sendAuthEmail,
} from "@/lib/email";
import { isValidEmail, normalizeEmail } from "@/lib/auth-validation";
import {
  generateToken,
  resetExpiresAt,
  resetIdentifier,
} from "@/lib/auth-tokens";

type ForgotBody = {
  email?: string;
};

export async function POST(request: Request) {
  let body: ForgotBody;

  try {
    body = (await request.json()) as ForgotBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? "");

  if (!email || !isValidEmail(email)) {
    return Response.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user?.password) {
    return Response.json({
      success: true,
      message: "If an account exists, a reset link has been sent.",
    });
  }

  const identifier = resetIdentifier(email);
  const token = generateToken();
  const expires = resetExpiresAt();

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  const baseUrl = getAppBaseUrl();
  const resetUrl = `${baseUrl}/auth/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  const emailResult = await sendAuthEmail({
    to: email,
    subject: "Reset your Clinovyr password",
    html: buildPasswordResetEmailHtml({
      name: user.name ?? "there",
      resetUrl,
    }),
  });

  if (!emailResult.ok) {
    return Response.json({ error: emailResult.error }, { status: 500 });
  }

  return Response.json({
    success: true,
    message: "If an account exists, a reset link has been sent.",
  });
}
