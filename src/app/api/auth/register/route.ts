import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  buildVerificationEmailHtml,
  getAppBaseUrl,
  sendAuthEmail,
} from "@/lib/email";
import { isValidEmail, normalizeEmail } from "@/lib/auth-validation";
import { generateToken, verificationExpiresAt } from "@/lib/auth-tokens";

const SALT_ROUNDS = 12;

type RegisterBody = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export async function POST(request: Request) {
  let body: RegisterBody;

  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const fullName = body.fullName?.trim() ?? "";
  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";
  const confirmPassword = body.confirmPassword ?? "";

  if (!fullName || fullName.length < 2) {
    return Response.json(
      { error: "Please enter your full name." },
      { status: 400 },
    );
  }

  if (!email || !isValidEmail(email)) {
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

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return Response.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const token = generateToken();
  const expires = verificationExpiresAt();

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        email,
        name: fullName,
        password: hashedPassword,
      },
    });

    await tx.verificationToken.deleteMany({ where: { identifier: email } });

    await tx.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });
  });

  const baseUrl = getAppBaseUrl();
  const verifyUrl = `${baseUrl}/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  const emailResult = await sendAuthEmail({
    to: email,
    subject: "Verify your Clinovyr account",
    html: buildVerificationEmailHtml({ name: fullName, verifyUrl }),
  });

  if (!emailResult.ok) {
    await prisma.$transaction([
      prisma.verificationToken.deleteMany({ where: { identifier: email } }),
      prisma.user.delete({ where: { email } }),
    ]);
    return Response.json({ error: emailResult.error }, { status: 500 });
  }

  return Response.json({
    success: true,
    message: "Verification email sent",
  });
}
