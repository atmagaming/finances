import { randomBytes } from "node:crypto";
import { Resend } from "resend";

export default defineEventHandler(async (event) => {
  const { email } = await readBody<{ email: string }>(event);

  if (!email) throw createError({ statusCode: 400, message: "Email is required" });

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({ data: { token, userId: user.id, expiresAt } });

    const config = useRuntimeConfig();
    const baseUrl = config.public.authUrl;
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    try {
      const resend = new Resend(config.resendApiKey as string);
      await resend.emails.send({
        from: config.resendFromEmail as string,
        to: email,
        subject: "Reset your password",
        html: `<p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      });
    } catch (e) {
      console.error("Failed to send reset email:", e);
    }
  }

  return { success: true };
});
