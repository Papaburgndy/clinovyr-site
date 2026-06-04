import { prisma } from "@/lib/prisma";
import {
  buildVerificationEmailHtml,
  getAppBaseUrl,
  sendAuthEmail,
} from "@/lib/email";
import { isValidEmail, normalizeEmail } from "@/lib/auth-validation";
import { generateToken, verificationExpiresAt } from "@/lib/auth-tokens";

type ResendBody = {
  email?: string;
};

export async function POST(request: Request) {
  let body: ResendBody;

  try {
    body = (await request.json()) as ResendBody;
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

  if (!user) {
    return Response.json({
      success: true,
      message: "If an account exists, a verification email has been sent.",
    });
  }

  if (user.emailVerified) {
    return Response.json(
      { error: "This email is already verified. You can sign in." },
      { status: 400 },
    );
  }

  const token = generateToken();
  const expires = verificationExpiresAt();

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  const baseUrl = getAppBaseUrl();
  const verifyUrl = `${baseUrl}/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  const emailResult = await sendAuthEmail({
    to: email,
    subject: "Verify your Clinovyr account",
    html: buildVerificationEmailHtml({
      name: user.name ?? "there",
      verifyUrl,
    }),
  });

  if (!emailResult.ok) {
    return Response.json({ error: emailResult.error }, { status: 500 });
  }

  return Response.json({
    success: true,
    message: "Verification email sent",
  });
}
