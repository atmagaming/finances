import type { RequestHandler } from "./$types";
import { randomBytes } from "node:crypto";
import { Resend } from "resend";
import { env } from "$env/dynamic/private";
import { env as publicEnv } from "$env/dynamic/public";
import { prisma } from "$lib/server/prisma";

export const POST: RequestHandler = async ({ request }) => {
  const { email } = (await request.json()) as { email?: string };

  if (!email) {
    return new Response(JSON.stringify({ message: "Email is required" }), { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });

    const baseUrl = publicEnv.PUBLIC_AUTH_URL || "http://localhost:5173";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    try {
      const resend = new Resend(env.RESEND_API_KEY as string);
      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL || "noreply@example.com",
        to: email,
        subject: "Reset your password",
        html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      });
    } catch (e) {
      console.error("Failed to send reset email:", e);
    }
  }

  return new Response(JSON.stringify({ success: true }));
};
