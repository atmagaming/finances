import { hash } from "bcryptjs";

export default defineEventHandler(async (event) => {
  const { token, password } = await readBody<{ token: string; password: string }>(event);

  if (!token || !password) throw createError({ statusCode: 400, message: "Token and password are required" });
  if (password.length < 8) throw createError({ statusCode: 400, message: "Password must be at least 8 characters" });

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date())
    throw createError({ statusCode: 400, message: "Invalid or expired token" });

  const passwordHash = await hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  return { success: true };
});
